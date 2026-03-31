import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const register = async (req: Request, res: Response) => {
  const { email, password, referralCode } = req.body;

  try {
    // 1. Vérifier si l'utilisateur existe déjà
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    // 2. Hachage du mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Générer code parrainage et OTP
    const myReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Gérer le parrainage (Vérifier le code du parrain)
    let referredBy = null;
    if (referralCode) {
      const referrer = await pool.query('SELECT id FROM users WHERE referral_code = $1', [referralCode]);
      if (referrer.rows.length > 0) {
        referredBy = referrer.rows[0].id;
      }
    }

    // 5. Créer l'utilisateur (is_verified est FALSE par défaut)
    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash, referral_code, otp_code, is_verified) VALUES ($1, $2, $3, $4, FALSE) RETURNING id, email',
      [email, hashedPassword, myReferralCode, otp]
    );

    const userId = newUser.rows[0].id;

    // 6. Créer le portefeuille
    await pool.query('INSERT INTO wallets (user_id, balance) VALUES ($1, $2)', [userId, 100.00]);

    // 7. Bonus Parrainage
    if (referredBy) {
      const BONUS_AMOUNT = 50.00;
      await pool.query('UPDATE wallets SET balance = balance + $1, bonus_balance = bonus_balance + $1 WHERE user_id = $2', [BONUS_AMOUNT, referredBy]);
      await pool.query('INSERT INTO transactions (user_id, type, amount, status) VALUES ($1, $2, $3, $4)', [referredBy, 'referral_bonus', BONUS_AMOUNT, 'completed']);
    }

    // SIMULATION EMAIL DANS LA CONSOLE WSL
    console.log("-----------------------------------------");
    console.log(`NOUVEL INSCRIT : ${email}`);
    console.log(`CODE DE VÉRIFICATION OTP : ${otp}`);
    console.log("-----------------------------------------");

    res.status(201).json({
      message: "Compte créé. Veuillez vérifier votre email.",
      email: email // On renvoie l'email pour aider le frontend
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de l'inscription." });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    const user = userResult.rows[0];

    // VERROU SÉCURITÉ : Vérifier si l'email est validé
    if (user.is_verified === false) {
      return res.status(403).json({ 
        message: "Votre compte n'est pas encore vérifié. Veuillez entrer le code reçu par email.",
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
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la connexion." });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  const { email, code } = req.body;
  try {
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND otp_code = $2',
      [email, code]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Code de vérification incorrect." });
    }

    // On valide l'utilisateur et on vide l'OTP
    await pool.query(
      'UPDATE users SET is_verified = TRUE, otp_code = NULL WHERE email = $1',
      [email]
    );

    res.json({ message: "Votre compte a été vérifié avec succès !" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur de vérification." });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    // TEST 1 : Est-ce que l'ID existe ?
    if (!userId) return res.status(401).json({ message: "ID manquant" });

    // TEST 2 : Requête ultra-basique sans jointure
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (userRes.rows.length === 0) return res.status(404).json({ message: "User not found" });

    const user = userRes.rows[0];

    // TEST 3 : On cherche le wallet à part
    const walletRes = await pool.query('SELECT * FROM wallets WHERE user_id = $1', [userId]);
    const balance = walletRes.rows.length > 0 ? walletRes.rows[0].balance : 0;

    // On renvoie tout
    res.json({
      id: user.id,
      email: user.email,
      username: user.username, // Vérifie si cette colonne existe !
      referral_code: user.referral_code,
      balance: parseFloat(balance)
    });

  } catch (error: any) {
    // ON RENVOIE L'ERREUR RÉELLE POUR LA VOIR DANS LE NAVIGATEUR
    res.status(500).json({ 
      message: "Erreur Serveur", 
      errorDetail: error.message,
      stack: error.stack 
    });
  }
};