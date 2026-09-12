import { Router } from 'express';
import { itemsController } from './items.controller';
import { validate } from '../../middleware/validate';
import { createItemSchema, updateItemSchema } from './items.service';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', itemsController.getAll);
router.get('/:id', itemsController.getById);

router.post('/', authorize('ADMIN', 'OPERATIONS'), validate(createItemSchema), itemsController.create);
router.patch('/:id', authorize('ADMIN', 'OPERATIONS'), validate(updateItemSchema), itemsController.update);

export default router;
