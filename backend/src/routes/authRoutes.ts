import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);

// Route protégée : nécessite un Token valide
router.get('/me', authenticateToken, getMe);

export default router;