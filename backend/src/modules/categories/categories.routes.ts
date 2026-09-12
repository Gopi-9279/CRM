import { Router } from 'express';
import { categoriesController } from './categories.controller';
import { validate } from '../../middleware/validate';
import { createCategorySchema } from './categories.service';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', categoriesController.getAll);
router.post('/', authorize('ADMIN', 'OPERATIONS'), validate(createCategorySchema), categoriesController.create);

export default router;
