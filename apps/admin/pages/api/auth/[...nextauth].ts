import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : undefined,
});

export default NextAuth({
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
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            schoolId: user.school_id,
            accessToken: `local-admin-session:${user.id}`,
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
        token.accessToken = user.accessToken;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.user.role = token.role as string;
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
});
