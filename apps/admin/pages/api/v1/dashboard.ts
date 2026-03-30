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
    const userResult = await pool.query(
      `SELECT id, name, email, role, "schoolId" AS "schoolId", "avatarUrl" AS "avatarUrl"
       FROM users
       WHERE id = $1 AND "isActive" = true
       LIMIT 1`,
      [auth.userId]
    );

    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const schoolId = user.schoolId ?? auth.schoolId;
    if (!schoolId) {
      return res.status(400).json({ error: "User is not linked to a school." });
    }

    const statsResult = await pool.query(
      `SELECT
         COUNT(*)::int AS "totalUsers",
         COUNT(*) FILTER (WHERE role = 'TEACHER')::int AS "teacherCount",
         COUNT(*) FILTER (WHERE role = 'STUDENT')::int AS "studentCount",
         COUNT(*) FILTER (WHERE "isActive" = true)::int AS "activeUsers"
       FROM users
       WHERE "schoolId" = $1`,
      [schoolId]
    );

    const classCountResult = await pool.query(
      `SELECT COUNT(*)::int AS "totalClasses"
       FROM classes
       WHERE "schoolId" = $1`,
      [schoolId]
    );

    const lessonCountResult = await pool.query(
      `SELECT COUNT(*)::int AS "totalLessons"
       FROM lessons
       WHERE "schoolId" = $1`,
      [schoolId]
    );

    const quizCountResult = await pool.query(
      `SELECT COUNT(*)::int AS "totalQuizzes"
       FROM quizzes q
       INNER JOIN lessons l ON l.id = q."lessonId"
       WHERE l."schoolId" = $1`,
      [schoolId]
    );

    const stats = {
      ...statsResult.rows[0],
      ...classCountResult.rows[0],
      ...lessonCountResult.rows[0],
      ...quizCountResult.rows[0],
    };

    return res.status(200).json({ user, stats });
  } catch (error) {
    console.error("[admin/api/v1/dashboard] failed", error);
    return res.status(500).json({ error: "Failed to load dashboard data." });
  }
}
