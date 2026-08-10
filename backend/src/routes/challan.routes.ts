import { Router } from 'express';
import { ChallanController } from '../controllers/challan.controller';
import { authenticateToken } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';
import { createChallanSchema } from '../validators/challan.validator';

const router = Router();

router.use(authenticateToken);

router.get('/', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'), ChallanController.getChallans);
router.get('/:id', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'), ChallanController.getChallanById);

router.post('/', authorizeRoles('ADMIN', 'SALES'), validateBody(createChallanSchema), ChallanController.createChallan);
router.post('/:id/confirm', authorizeRoles('ADMIN', 'SALES'), ChallanController.confirmChallan);
router.post('/:id/cancel', authorizeRoles('ADMIN', 'SALES'), ChallanController.cancelChallan);

export default router;
