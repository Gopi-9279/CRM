import { Router } from 'express';
import { usersController } from './users.controller';
import { validate } from '../../middleware/validate';
import { createUserSchema } from './users.service';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// Only ADMIN can manage users
router.use(authenticate, authorize('ADMIN'));

router.get('/', usersController.getAll);
router.get('/:id', usersController.getById);
router.post('/', validate(createUserSchema), usersController.create);

export default router;
