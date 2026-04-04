import { Response } from 'express';
import pool from '../config/db.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

// --- LOGIQUE CORRIGÉE : MULTIPLICATEUR DYNAMIQUE ---
const calculateTarget = (amount: number): number => {
  if (amount >= 1000) return amount * 13;   // Ex: 1000 -> 13000 (x13)
  if (amount >= 500) return amount * 12;    // Ex: 500 -> 6000 (x12)
  if (amount >= 300) return amount * 11.66; // Ex: 300 -> 3500 (approx x11.66)
  if (amount >= 100) return amount * 10;    // Ex: 100 -> 1000 (x10) | 200 -> 2000
  return amount * 2;
};

export const startTrade = async (req: AuthRequest, res: Response) => {
  const amount = parseFloat(req.body.amount);
  const crypto_symbol = req.body.crypto_symbol;
  const userId = req.user?.id;

  if (!amount || isNaN(amount) || !crypto_symbol) {
    return res.status(400).json({ 
      message: "Données invalides. 'amount' (nombre) et 'crypto_symbol' (string) sont requis." 
    });
  }

  // Sécurité supplémentaire : Montant minimum
  if (amount < 100) {
    return res.status(400).json({ message: "Le montant minimum pour trader est de 100$." });
  }

  try {
    // Vérifier si un trade est déjà en cours pour cet utilisateur
    const activeCheck = await pool.query(
      "SELECT id FROM trades WHERE user_id = $1 AND status = 'running'",
      [userId]
    );

    if (activeCheck.rows.length > 0) {
      return res.status(400).json({ message: "Vous avez déjà un trade en cours." });
    }

    const wallet = await pool.query('SELECT balance FROM wallets WHERE user_id = $1', [userId]);
    
    if (wallet.rows.length === 0 || parseFloat(wallet.rows[0].balance) < amount) {
      return res.status(400).json({ message: "Solde insuffisant ou portefeuille introuvable." });
    }

    // 3. Débit du solde
    await pool.query('UPDATE wallets SET balance = balance - $1 WHERE user_id = $2', [amount, userId]);

    // CALCUL PROPORTIONNEL
    const targetProfit = calculateTarget(amount);
    // const endTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const endTime = new Date(Date.now() + 60 * 1000); // 1 minute EXACTEMENT

    // 4. Insertion avec targetProfit dynamique
    const newTrade = await pool.query(
      `INSERT INTO trades 
      (user_id, crypto_symbol, amount_invested, target_profit, start_price, current_simulated_price, end_time, status) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [userId, crypto_symbol, amount, targetProfit, 50000.0, 50000.0, endTime, 'running']
    );

    res.status(201).json({ 
      message: "Robot démarré avec succès", 
      trade: newTrade.rows[0],
      target_profit: targetProfit 
    });
  } catch (error) {
    console.error("Détail erreur SQL:", error);
    res.status(500).json({ message: "Erreur serveur lors du lancement." });
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

export const finalizeTrade = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    // 1. On récupère le trade en vérifiant qu'il est bien 'running'
    const tradeQuery = await pool.query(
      "SELECT * FROM trades WHERE user_id = $1 AND status = 'running' LIMIT 1",
      [userId]
    );

    if (tradeQuery.rows.length === 0) {
      return res.status(404).json({ message: "Aucun trade actif trouvé." });
    }

    const trade = tradeQuery.rows[0];
    const now = new Date();
    const endTime = new Date(trade.end_time);

    // --- SÉCURITÉ RÉTABLIE --- 
    // On compare l'heure actuelle du serveur avec l'heure de fin en BD
    // On ajoute une petite marge de 2 secondes pour les décalages réseau
    if (now.getTime() < (endTime.getTime() - 2000)) {
      return res.status(400).json({ 
        message: "Sécurité : Le trade est encore en cours. Retrait impossible." 
      });
    }

    await pool.query('BEGIN');

    // On utilise UNIQUEMENT le montant stocké en base de données au début du trade
    const finalAmount = parseFloat(trade.target_profit);

    // Crédit du portefeuille
    await pool.query(
      "UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE user_id = $2",
      [finalAmount, userId]
    );

    // Marquage du trade comme terminé
    await pool.query(
      "UPDATE trades SET status = 'completed', end_time = NOW() WHERE id = $1",
      [trade.id]
    );

    await pool.query('COMMIT');
    res.json({ message: "Retrait réussi !", credited_amount: finalAmount });

  } catch (error) {
    await pool.query('ROLLBACK');
    console.error("Erreur finalize:", error);
    res.status(500).json({ message: "Erreur serveur lors du retrait." });
  }
};