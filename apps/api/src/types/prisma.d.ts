// TypeScript declaration to extend PrismaClient with missing models
// This is needed because the Prisma client wasn't regenerated after adding the models
// Run 'npx prisma generate' in packages/db to regenerate the client

export interface CompetencyProgress {
  id: string;
  studentId: string;
  competencyId: string;
  masteryLevel: string;
  notes: string | null;
  evaluatedBy: string | null;
  evaluatedAt: Date | null;
  schoolId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LevelSubject {
  id: string;
  levelId: string;
  subjectId: string;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Augment the Prisma client with any type to allow all operations
declare module '@prisma/client' {
  interface PrismaClient {
    competencyProgress: {
      findMany: (args?: any) => Promise<any[]>;
      findUnique: (args: any) => Promise<any | null>;
      findFirst: (args: any) => Promise<any | null>;
      create: (args: any) => Promise<any>;
      update: (args: any) => Promise<any>;
      delete: (args: any) => Promise<any>;
    };
    levelSubject: {
      findMany: (args?: any) => Promise<any[]>;
      findUnique: (args: any) => Promise<any | null>;
      create: (args: any) => Promise<any>;
      update: (args: any) => Promise<any>;
      delete: (args: any) => Promise<any>;
    };
  }
}

