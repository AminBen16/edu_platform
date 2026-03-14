// Types for 'db' module - extends PrismaClient
// Generated from packages/db after build

import type { PrismaClient } from '@prisma/client';

declare module 'db' {
  export * from '@prisma/client';
  export const prisma: PrismaClient;
  export default prisma;
}

// Extend PrismaClient with custom models
declare module '@prisma/client' {
  interface PrismaClient {
    $queryRaw<T = any>(query: TemplateStringsArray | string, ...values: any[]): Promise<T>;
  }
}
