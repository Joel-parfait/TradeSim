import { Request, Response } from 'express';
import pool from '../config/db.js';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await pool.query(
      'SELECT id, email, referral_code, balance, created_at FROM users JOIN wallets ON users.id = wallets.user_id'
    );
    res.json(users.rows);
  } catch (error) {
    res.status(500).json({ message: "Erreur admin : impossible de récupérer les utilisateurs." });
  }
};

export const getAllTrades = async (req: Request, res: Response) => {
  try {
    const trades = await pool.query('SELECT * FROM trades ORDER BY start_time DESC');
    res.json(trades.rows);
  } catch (error) {
    res.status(500).json({ message: "Erreur admin : impossible de récupérer les trades." });
  }
};