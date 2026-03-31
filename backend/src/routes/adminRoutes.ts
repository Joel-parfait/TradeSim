import { Router } from 'express';
import { getAllUsers, getAllTrades } from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Ici on pourrait ajouter un middleware "isAdmin" plus tard pour plus de sécurité
router.get('/users', authenticateToken, getAllUsers);
router.get('/trades', authenticateToken, getAllTrades);

export default router;