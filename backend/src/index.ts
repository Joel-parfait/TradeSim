import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import tradeRoutes from './routes/tradeRoutes.js'; 
import adminRoutes from './routes/adminRoutes.js';
import referralRoutes from './routes/referralRoutes.js';
import { updateSimulatedTrades } from './utils/simulationWorker.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/referrals', referralRoutes);

// Santé
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'OK', database: 'Connected', time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'Error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur TradeSim lancé sur http://localhost:${PORT}`);
  
  // On lance l'intervalle APRES le listen pour être sûr que tout est prêt
  setInterval(() => {
    updateSimulatedTrades();
  }, 5000);
});