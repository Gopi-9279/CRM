import 'dotenv/config';
import { prisma } from '../src/db/prisma';

export { prisma };
// We don't need beforeAll/afterAll here since Prisma auto-connects
// on the first query. If explicit disconnect is needed, we can
// do it in the individual test files.
