import { Router } from 'express';
import { batchesController } from './batches.controller';
import { validate } from '../../middleware/validate';
import { createBatchSchema } from './batches.service';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', batchesController.getAll);
router.post('/', authorize('ADMIN', 'OPERATIONS'), validate(createBatchSchema), batchesController.create);

export default router;
