import { PrismaClient } from 'db';
declare let prisma: PrismaClient;
declare global {
    var __prisma: PrismaClient | undefined;
}
export default prisma;
