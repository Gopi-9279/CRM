import { Router } from 'express';
import { transfersController } from './transfers.controller';
import { validate } from '../../middleware/validate';
import { createTransferSchema } from './transfers.service';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', transfersController.getAll);

router.post('/', authorize('ADMIN', 'OPERATIONS'), validate(createTransferSchema), transfersController.create);
router.patch('/:id/dispatch', authorize('ADMIN', 'OPERATIONS'), transfersController.dispatch);
router.patch('/:id/receive', authorize('ADMIN', 'OPERATIONS'), transfersController.receive);

export default router;
