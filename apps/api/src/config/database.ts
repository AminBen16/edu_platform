import { PrismaClient } from '@prisma/client';

declare global {
  var __eduPrisma__: PrismaClient | undefined;
}

export const prisma =
  global.__eduPrisma__ ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__eduPrisma__ = prisma;
}

export default prisma;
