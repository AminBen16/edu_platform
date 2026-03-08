// packages/auth/nextauth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma, { Role } from '../../packages/db';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
        if (!credentials?.email || !credentials.password || !credentials.schoolId) {
          throw new Error('Missing credentials');
        }

        const user = await prisma.user.findUnique({
          where: {
            email_schoolId: {
              email: credentials.email,
              schoolId: credentials.schoolId,
            },
          },
        });

        if (!user || !user.password) {
          throw new Error('No user found with this email in the specified school.');
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
    async jwt({ token, user, account }) {
      // Persist the user's role and schoolId in the JWT
      if (user) {
        token.role = user.role;
        token.schoolId = user.schoolId;
        token.id = user.id;
      }
      // Explicitly add the raw JWT token for API calls
      if (account?.access_token) {
        token.accessToken = account.access_token;
      } else if (token) {
          // If no access_token from account (e.g., Credentials provider)
          // re-sign the token to get a string representation if needed by the client.
          // IMPORTANT: This is a simplification. In a production app, the server-side API would validate the session cookie.
          // For client-side direct API calls, we need a JWT.
          const payload = {
              id: token.id,
              email: token.email,
              role: token.role,
              schoolId: token.schoolId,
          };
          // Sign the payload to get a new JWT token string.
          token.accessToken = jwt.sign(payload, process.env.NEXTAUTH_SECRET!);
      }
      return token;
    },
    async session({ session, token }) {
      // Add role and schoolId to the session object
      if (session.user) {
        session.user.role = token.role as Role;
        session.user.schoolId = token.schoolId as string;
        session.user.id = token.id as string;
      }
      // Add the access token to the session object
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
  pages: {
    signIn: '/auth/login', // Custom login page
  },
};