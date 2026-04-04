import { Router } from 'express';
import { 
  register, 
  login, 
  getMe, 
  verifyOTP, 
  updateProfile, 
  updatePassword // <--- Ajoute l'import
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// --- Routes Publiques ---
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP); 

// --- Routes Protégées ---
router.get('/me', authenticateToken, getMe);
router.put('/update-profile', authenticateToken, updateProfile);
router.put('/update-password', authenticateToken, updatePassword); // <--- Nouvelle route

export default router;