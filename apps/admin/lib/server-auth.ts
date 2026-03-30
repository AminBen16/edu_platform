import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { getToken } from "next-auth/jwt";

type AuthContext = {
  userId: string;
  email?: string;
  role?: string;
  schoolId?: string;
};

const getJwtSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("NEXTAUTH_SECRET is missing or invalid in admin app");
  }

  return secret;
};

export async function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthContext | null> {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice("Bearer ".length);
      const decoded = jwt.verify(token, getJwtSecret()) as AuthContext;

      if (!decoded.userId) {
        res.status(401).json({ error: "Invalid token payload." });
        return null;
      }

      return decoded;
    } catch (error) {
      res.status(401).json({ error: "Invalid or expired token." });
      return null;
    }
  }

  const sessionToken = await getToken({ req, secret: getJwtSecret() });
  if (!sessionToken?.id) {
    res.status(401).json({ error: "Not authenticated." });
    return null;
  }

  return {
    userId: sessionToken.id as string,
    email: sessionToken.email ?? undefined,
    role: sessionToken.role as string | undefined,
    schoolId: sessionToken.schoolId as string | undefined,
  };
}
