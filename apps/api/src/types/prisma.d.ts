declare module '@prisma/client' {
  export class PrismaClient {
    constructor(...args: any[]);
    [key: string]: any;
    $connect: () => Promise<void>;
    $disconnect: () => Promise<void>;
    $transaction: any;
    $queryRaw: any;
  }
}
