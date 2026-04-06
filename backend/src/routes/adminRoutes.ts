import { Router } from 'express';
import { 
  getAllUsers, 
  getAllTrades, 
  updateUserBalance, 
  updateUserStatus,
  deleteUser
} from '../controllers/adminController.js';
import { authenticateToken, isAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Toutes les routes admin passent par authenticateToken ET isAdmin
router.use(authenticateToken);
router.use(isAdmin);

// Lecture
router.get('/users', getAllUsers);
router.get('/trades', getAllTrades);

// Actions de gestion (accessibles aux Admin pour leurs filleuls et Super Admin pour tous)
router.put('/users/balance', updateUserBalance);
router.put('/users/status', updateUserStatus);

router.delete('/users/:targetUserId', authenticateToken, isAdmin, deleteUser);

export default router;