import { Router } from 'express';
import { startTrade, getActiveTrades, getTradeHistory } from '../controllers/tradeController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/start', authenticateToken, startTrade);
router.get('/active', authenticateToken, getActiveTrades); // Nouvelle route
router.get('/history', authenticateToken, getTradeHistory); // Nouvelle route

export default router;