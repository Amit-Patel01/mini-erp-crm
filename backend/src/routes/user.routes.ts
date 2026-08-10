import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Require ADMIN role for all user management endpoints
router.use(authenticateToken, requireAdmin);

router.get('/', UserController.getAllUsers);
router.post('/', UserController.createUser);
router.put('/:id/reset-password', UserController.resetPassword);
router.delete('/:id', UserController.deleteUser);

export default router;
