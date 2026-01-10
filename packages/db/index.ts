// packages/db/index.ts
// Database connection and exports
// Note: Prisma client needs to be generated before use
// Run: npx prisma generate

export * from '@prisma/client';
export { default as prisma } from './lib/prisma';
