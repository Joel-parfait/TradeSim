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

    // 2. Hachage du mot de passe (Sécurité CIRT !)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Générer un code de parrainage unique pour le nouvel utilisateur
    const myReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    // 4. Gérer le parrainage (si un code a été fourni à l'inscription)
    let referredBy = null;
    if (referralCode) {
      const referrer = await pool.query('SELECT id FROM users WHERE referral_code = $1', [referralCode]);
      if (referrer.rows.length > 0) {
        referredBy = referrer.rows[0].id;
      }
    }

    // 5. Créer l'utilisateur (Transaction SQL pour créer l'utilisateur ET son wallet)
    const newUser = await pool.query(
      'INSERT INTO users (email, password_hash, referral_code, referred_by) VALUES ($1, $2, $3, $4) RETURNING id, email, referral_code',
      [email, hashedPassword, myReferralCode, referredBy]
    );

    const userId = newUser.rows[0].id;

    // 6. Créer le portefeuille (Wallet) associé avec un bonus de bienvenue de 100$ (exemple)
    await pool.query(
      'INSERT INTO wallets (user_id, balance) VALUES ($1, $2)',
      [userId, 100.00]
    );

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      user: newUser.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de l'inscription." });
  }
};

// Ajoute "login" à tes imports de fonctions existants
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // 1. Chercher l'utilisateur
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    const user = userResult.rows[0];

    // 2. Vérifier le mot de passe (Comparaison du hash)
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    // 3. Créer le Token JWT (Expire dans 24h)
    const token = jwt.sign(
      { id: user.id, email: user.email, isAdmin: user.is_admin },
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    // 4. Envoyer la réponse (sans le password_hash !)
    res.json({
      message: "Connexion réussie",
      token,
      user: {
        id: user.id,
        email: user.email,
        referral_code: user.referral_code
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la connexion." });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    // Grâce au middleware, on a l'ID dans req.user
    const userResult = await pool.query(
      'SELECT id, email, referral_code, is_admin FROM users WHERE id = $1',
      [req.user?.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    res.json(userResult.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};