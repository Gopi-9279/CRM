import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { validate } from '../../middleware/validate';
import { createInventorySchema, adjustStockSchema } from './inventory.service';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', inventoryController.getAll);
router.get('/:id', inventoryController.getById);
router.get('/:id/transactions', inventoryController.getTransactions);

router.post('/', authorize('ADMIN', 'OPERATIONS'), validate(createInventorySchema), inventoryController.create);
router.patch('/:id', authorize('ADMIN', 'OPERATIONS'), validate(adjustStockSchema), inventoryController.adjustStock);

export default router;
