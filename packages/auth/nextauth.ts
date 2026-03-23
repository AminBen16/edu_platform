// packages/auth/nextauth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Define Role type locally
enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
}

// Initialize Prisma client
const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        schoolId: { label: 'School ID', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error('Missing credentials');
        }

        const users = await prisma.user.findMany({
          where: { email: credentials.email },
        });

        if (users.length === 0) {
          throw new Error('No user found with this email.');
        }

        let user = users[0];

        if (users.length > 1) {
          if (!credentials.schoolId) {
            throw new Error('Multiple accounts found. Provide a school ID.');
          }

          const matchedUser = users.find(
            (candidate) => candidate.schoolId === credentials.schoolId
          );

          if (!matchedUser) {
            throw new Error(
              'No user found with this email in the specified school.'
            );
          }

          user = matchedUser;
        }

        if (!user.password) {
          throw new Error('No user found with valid credentials.');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Invalid password.');
        }

        // Only allow admins and teachers to log in to the admin panel
        if (user.role !== Role.SUPER_ADMIN && user.role !== Role.SCHOOL_ADMIN && user.role !== Role.TEACHER) {
          throw new Error('You do not have permission to access the admin panel.');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          schoolId: user.schoolId,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      // Persist the user's role and schoolId in the JWT
      if (user) {
        token.role = user.role;
        token.schoolId = user.schoolId;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add role and schoolId to the session object
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).schoolId = token.schoolId;
        (session.user as any).id = token.id;
      }
      // Add the access token to the session object
      (session as any).accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: '/auth/login', // Custom login page
  },
};

// Export production URL - use environment variable
export const nextAuthUrl = process.env.NEXTAUTH_URL;
