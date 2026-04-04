import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const register = async (req: Request, res: Response) => {
  const { email, password, referralCode } = req.body;
  const client = await pool.connect(); // Utilisation d'un client pour la transaction

  try {
    // 1. Vérifier si l'utilisateur existe déjà avant de commencer
    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    await client.query('BEGIN'); // DÉBUT DE LA TRANSACTION

    // 2. Hachage du mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Générer code parrainage et OTP
    const myReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Gérer le parrainage (Recherche insensible à la casse)
    let referredBy = null;
    if (referralCode && referralCode.trim() !== "") {
      const referrer = await client.query(
        'SELECT id FROM users WHERE UPPER(referral_code) = UPPER($1)', 
        [referralCode.trim()]
      );
      if (referrer.rows.length > 0) {
        referredBy = referrer.rows[0].id;
      } else {
        // Optionnel : Bloquer si le code est fourni mais invalide
        await client.query('ROLLBACK');
        return res.status(400).json({ message: "Le code de parrainage est invalide." });
      }
    }

    // 5. Créer l'utilisateur
    const newUser = await client.query(
      `INSERT INTO users (email, password_hash, referral_code, otp_code, is_verified, referred_by) 
       VALUES ($1, $2, $3, $4, FALSE, $5) RETURNING id, email`,
      [email.toLowerCase().trim(), hashedPassword, myReferralCode, otp, referredBy]
    );

    const userId = newUser.rows[0].id;

    // 6. Créer le portefeuille (Wallet)
    // On met 100$ de bienvenue comme dans ton code initial
    await client.query(
      'INSERT INTO wallets (user_id, balance) VALUES ($1, $2)', 
      [userId, 100.00]
    );

    // 7. Bonus Parrainage
    if (referredBy) {
      const BONUS_AMOUNT = 5.00;
      // Mise à jour du wallet du parrain
      await client.query(
        'UPDATE wallets SET balance = balance + $1, bonus_balance = bonus_balance + $1 WHERE user_id = $2', 
        [BONUS_AMOUNT, referredBy]
      );
      // Historique de transaction pour le parrain
      await client.query(
        'INSERT INTO transactions (user_id, type, amount) VALUES ($1, $2, $3)', 
        [referredBy, 'referral_bonus', BONUS_AMOUNT]
      );
    }

    await client.query('COMMIT'); // TOUT EST OK, ON SAUVEGARDE

    // SIMULATION EMAIL
    console.log("-----------------------------------------");
    console.log(`NOUVEL INSCRIT : ${email}`);
    console.log(`CODE DE VÉRIFICATION OTP : ${otp}`);
    console.log("-----------------------------------------");

    res.status(201).json({
      message: "Compte créé. Veuillez vérifier votre email.",
      email: email
    });

  } catch (error: any) {
    await client.query('ROLLBACK'); // ANNULE TOUT EN CAS D'ERREUR
    console.error("ERREUR REGISTRE:", error);
    res.status(500).json({ message: "Erreur lors de l'inscription.", detail: error.message });
  } finally {
    client.release();
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    const user = userResult.rows[0];

    if (user.is_verified === false) {
      return res.status(403).json({ 
        message: "Compte non vérifié. Veuillez entrer le code OTP.",
        requireVerification: true,
        email: user.email
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: user.is_admin },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    res.json({
      message: "Connexion réussie",
      token,
      user: { id: user.id, email: user.email, referral_code: user.referral_code }
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la connexion." });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  const { email, code } = req.body;
  try {
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND otp_code = $2',
      [email.toLowerCase().trim(), code]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Code de vérification incorrect." });
    }

    await pool.query(
      'UPDATE users SET is_verified = TRUE, otp_code = NULL WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    res.json({ message: "Votre compte a été vérifié avec succès !" });
  } catch (error) {
    res.status(500).json({ message: "Erreur de vérification." });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Non autorisé" });

    const userRes = await pool.query('SELECT id, email, referral_code FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) return res.status(404).json({ message: "Utilisateur non trouvé" });

    const user = userRes.rows[0];
    const walletRes = await pool.query('SELECT balance FROM wallets WHERE user_id = $1', [userId]);
    const balance = walletRes.rows.length > 0 ? walletRes.rows[0].balance : 0;

    res.json({
      id: user.id,
      email: user.email,
      referral_code: user.referral_code,
      balance: parseFloat(balance)
    });
  } catch (error: any) {
    res.status(500).json({ message: "Erreur Serveur", detail: error.message });
  }
};