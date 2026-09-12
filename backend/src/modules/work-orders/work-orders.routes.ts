import { Router } from 'express';
import { workOrdersController } from './work-orders.controller';
import { validate } from '../../middleware/validate';
import { createWorkOrderSchema, updateStatusSchema } from './work-orders.service';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', workOrdersController.getAll);
router.get('/:id', workOrdersController.getById);
router.get('/:id/stock-check', workOrdersController.getStockCheck);

router.post('/', authorize('ADMIN'), validate(createWorkOrderSchema), workOrdersController.create);
router.patch('/:id/status', authorize('ADMIN', 'OPERATIONS'), validate(updateStatusSchema), workOrdersController.updateStatus);

export default router;
