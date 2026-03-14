// Re-export Prisma client from packages/db
// This ensures a single instance is used across the application
import { prisma } from 'db';
export { prisma };
export default prisma;

