import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticateToken } from '../middleware/auth';
import { authorizeRoles } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';
import { createProductSchema, updateProductSchema } from '../validators/product.validator';

const router = Router();

router.use(authenticateToken);

// Read endpoints accessible by ADMIN, WAREHOUSE, SALES, ACCOUNTS
router.get('/', authorizeRoles('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'), ProductController.getProducts);
router.get('/:id', authorizeRoles('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'), ProductController.getProductById);

// Write endpoints accessible by ADMIN, WAREHOUSE
router.post('/', authorizeRoles('ADMIN', 'WAREHOUSE'), validateBody(createProductSchema), ProductController.createProduct);
router.put('/:id', authorizeRoles('ADMIN', 'WAREHOUSE'), validateBody(updateProductSchema), ProductController.updateProduct);

export default router;
