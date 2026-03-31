import { Response } from 'express';
import pool from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

const calculateTarget = (amount: number): number => {
  if (amount >= 1000) return 13000;
  if (amount >= 500) return 6000;
  if (amount >= 300) return 3500;
  if (amount >= 100) return 1000;
  return amount * 2;
};

export const startTrade = async (req: AuthRequest, res: Response) => {
  // 1. Extraction et conversion forcée pour éviter les NaN
  const amount = parseFloat(req.body.amount);
  const crypto_symbol = req.body.crypto_symbol;
  const userId = req.user?.id;

  // 2. Vérification de sécurité
  if (!amount || isNaN(amount) || !crypto_symbol) {
    return res.status(400).json({ 
      message: "Données invalides. 'amount' (nombre) et 'crypto_symbol' (string) sont requis." 
    });
  }

  try {
    const wallet = await pool.query('SELECT balance FROM wallets WHERE user_id = $1', [userId]);
    
    if (wallet.rows.length === 0 || wallet.rows[0].balance < amount) {
      return res.status(400).json({ message: "Solde insuffisant ou portefeuille introuvable." });
    }

    // 3. Débit du solde
    await pool.query('UPDATE wallets SET balance = balance - $1 WHERE user_id = $2', [amount, userId]);

    const targetProfit = calculateTarget(amount);
    const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 4. Insertion avec toutes les valeurs explicitées
    const newTrade = await pool.query(
      `INSERT INTO trades 
      (user_id, crypto_symbol, amount_invested, target_profit, start_price, current_simulated_price, end_time, status) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [userId, crypto_symbol, amount, targetProfit, 50000.0, 50000.0, endTime, 'running']
    );

    res.status(201).json({ message: "Robot démarré avec succès", trade: newTrade.rows[0] });
  } catch (error) {
    console.error("Détail erreur SQL:", error);
    res.status(500).json({ message: "Erreur serveur lors de la création du trade." });
  }
};
// Récupérer les robots en cours d'un utilisateur
export const getActiveTrades = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    const trades = await pool.query(
      "SELECT * FROM trades WHERE user_id = $1 AND status = 'running' ORDER BY start_time DESC",
      [userId]
    );
    res.json(trades.rows);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération des trades actifs." });
  }
};

// Récupérer l'historique complet (terminés et annulés)
export const getTradeHistory = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    const trades = await pool.query(
      "SELECT * FROM trades WHERE user_id = $1 AND status != 'running' ORDER BY end_time DESC",
      [userId]
    );
    res.json(trades.rows);
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la récupération de l'historique." });
  }
};