import { Router } from 'express';
import { locationsController } from './locations.controller';
import { validate } from '../../middleware/validate';
import { createLocationSchema, updateLocationSchema } from './locations.service';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', locationsController.getAll);
router.get('/:id', locationsController.getById);

// Operations or Admin to modify
router.post('/', authorize('ADMIN', 'OPERATIONS'), validate(createLocationSchema), locationsController.create);
router.patch('/:id', authorize('ADMIN', 'OPERATIONS'), validate(updateLocationSchema), locationsController.update);

export default router;
