import { Router } from 'express';
import { StockMovementController } from '../controllers/stockMovement.controller';
import { authenticateToken } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';
import { createStockMovementSchema } from '../validators/stockMovement.validator';

const router = Router();

router.use(authenticateToken);

router.get('/', authorizeRoles('ADMIN', 'WAREHOUSE', 'ACCOUNTS'), StockMovementController.getStockMovements);
router.post('/', authorizeRoles('ADMIN', 'WAREHOUSE'), validateBody(createStockMovementSchema), StockMovementController.createStockMovement);

export default router;
