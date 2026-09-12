import { prisma } from '../../db/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ConflictError, NotFoundError } from '../../lib/errors';


export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role_id: z.number().int().positive(),
    location_id: z.string().uuid().optional(),
  }),
});

export const usersService = {
  async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        is_active: true,
        created_at: true,
      },
    });
  },

  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: { select: { id: true, name: true } },
        location: { select: { id: true, name: true } },
        is_active: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  },

  async createUser(data: z.infer<typeof createUserSchema>['body']) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictError('EMAIL_EXISTS', 'A user with this email already exists');
    }

    const password_hash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password_hash,
        role_id: data.role_id,
        location_id: data.location_id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: { select: { name: true } },
      },
    });

    return user;
  },
};
