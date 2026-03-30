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
         q.id,
         q.title,
         NULL::text AS description,
         ARRAY[]::json[] AS questions,
         NULL::int AS duration,
         true AS "isPublished",
         q."createdAt" AS "createdAt",
         q."createdAt" AS "updatedAt"
       FROM quizzes q
       INNER JOIN lessons l ON l.id = q."lessonId"
       WHERE l."schoolId" = $1
       ORDER BY q."createdAt" DESC`,
      [schoolId]
    );

    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("[admin/api/v1/quizzes] failed", error);
    return res.status(500).json({ error: "Failed to load quizzes." });
  }
}
