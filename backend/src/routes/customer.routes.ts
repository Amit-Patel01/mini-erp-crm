import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticateToken } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';
import {
  createCustomerSchema,
  updateCustomerSchema,
  createFollowUpSchema,
} from '../validators/customer.validator';

const router = Router();

router.use(authenticateToken);

// Read endpoints accessible by ADMIN, SALES, ACCOUNTS
router.get('/', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'), CustomerController.getCustomers);
router.get('/:id', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'), CustomerController.getCustomerById);
router.get('/:id/follow-ups', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'), CustomerController.getFollowUps);
router.get('/:id/followups', authorizeRoles('ADMIN', 'SALES', 'ACCOUNTS'), CustomerController.getFollowUps);

// Write endpoints accessible by ADMIN, SALES
router.post('/', authorizeRoles('ADMIN', 'SALES'), validateBody(createCustomerSchema), CustomerController.createCustomer);
router.put('/:id', authorizeRoles('ADMIN', 'SALES'), validateBody(updateCustomerSchema), CustomerController.updateCustomer);
router.delete('/:id', authorizeRoles('ADMIN'), CustomerController.deleteCustomer);
router.post('/:id/follow-up', authorizeRoles('ADMIN', 'SALES'), validateBody(createFollowUpSchema), CustomerController.addFollowUp);
router.post('/:id/followups', authorizeRoles('ADMIN', 'SALES'), validateBody(createFollowUpSchema), CustomerController.addFollowUp);

export default router;
