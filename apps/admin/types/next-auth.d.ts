import 'next-auth';
import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import { Role } from '@prisma/client'; // Import Role from Prisma

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      schoolId: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    role: Role;
    schoolId: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    schoolId: string;
  }
}
