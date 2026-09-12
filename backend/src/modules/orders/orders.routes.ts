import { Router } from 'express';
import { ordersController } from './orders.controller';
import { validate } from '../../middleware/validate';
import { createOrderSchema, reserveItemSchema } from './orders.service';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', ordersController.getAll);
router.get('/:id', ordersController.getById);

router.post('/', authorize('ADMIN', 'SALES', 'OPERATIONS'), validate(createOrderSchema), ordersController.create);
router.post('/:id/reserve', authorize('ADMIN', 'OPERATIONS'), validate(reserveItemSchema), ordersController.reserveItem);

export default router;
