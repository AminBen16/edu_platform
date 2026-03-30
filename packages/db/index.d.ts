import { PrismaClient } from '@prisma/client';
declare const prismaClientSingleton: () => PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, $Extensions.DefaultArgs>;
declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, $Extensions.DefaultArgs>;
export * from '@prisma/client';
//# sourceMappingURL=index.d.ts.map