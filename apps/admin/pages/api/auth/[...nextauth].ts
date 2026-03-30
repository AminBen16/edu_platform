import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { NextAuthOptions } from "next-auth";
import { pool } from "../../../lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const result = await pool.query(
            `SELECT id, email, name, role,
                    "schoolId" AS school_id,
                    "isActive" AS is_active,
                    password
             FROM users
             WHERE lower(email) = lower($1)
             LIMIT 1`,
            [credentials.email]
          );

          const user = result.rows[0];
          if (!user || !user.is_active || !user.password) {
            return null;
          }

          const validPassword = await bcrypt.compare(credentials.password, user.password);
          if (!validPassword) {
            return null;
          }

          const jwtSecret = process.env.NEXTAUTH_SECRET;
          if (!jwtSecret || jwtSecret.length < 32) {
            console.error("Missing or invalid NEXTAUTH_SECRET in admin app");
            return null;
          }

          const accessToken = jwt.sign(
            {
              userId: user.id,
              email: user.email,
              role: user.role,
              schoolId: user.school_id,
            },
            jwtSecret,
            { expiresIn: "7d" }
          );
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            schoolId: user.school_id,
            accessToken,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accessToken = user.accessToken;
        token.role = user.role;
        token.schoolId = user.schoolId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.schoolId = token.schoolId as string;
      session.accessToken = token.accessToken as string;
      session.user.role = token.role as string;
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
};

export default NextAuth(authOptions);
