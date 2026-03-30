import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "../../../lib/db";
import { requireAuth } from "../../../lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const auth = await requireAuth(req, res);
  if (!auth?.userId) {
    return;
  }

  try {
    const schoolId = auth.schoolId ?? (
      await pool.query(
        `SELECT "schoolId" FROM users WHERE id = $1 LIMIT 1`,
        [auth.userId]
      )
    ).rows[0]?.schoolId;

    if (!schoolId) {
      return res.status(400).json({ error: "User is not linked to a school." });
    }

    const result = await pool.query(
      `SELECT
         id,
         name,
         email,
         role,
         "schoolId" AS "schoolId",
         "isActive" AS "isActive",
         "createdAt" AS "createdAt",
         "updatedAt" AS "updatedAt",
         NULL::text AS "avatarUrl"
       FROM users
       WHERE "schoolId" = $1
       ORDER BY "createdAt" DESC`,
      [schoolId]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("[admin/api/v1/users] failed", error);
    return res.status(500).json({ error: "Failed to load users." });
  }
}
