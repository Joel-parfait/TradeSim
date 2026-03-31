import { Router } from 'express';
import { register, login, getMe, verifyOTP } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// --- Routes Publiques ---
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP); // La nouvelle route pour valider le code à 6 chiffres

// --- Routes Protégées (nécessitent un Token valide) ---
router.get('/me', authenticateToken, getMe);

export default router;