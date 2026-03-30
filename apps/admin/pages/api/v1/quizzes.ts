import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "../../../lib/db";
import { requireAuth } from "../../../lib/server-auth";
import { createId, ensureAdminSchema } from "../../../lib/admin-data";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireAuth(req, res);
  if (!auth?.userId) {
    return;
  }

  try {
    await ensureAdminSchema();
    const schoolId = auth.schoolId ?? (
      await pool.query(
        `SELECT "schoolId" FROM users WHERE id = $1 LIMIT 1`,
        [auth.userId]
      )
    ).rows[0]?.schoolId;

    if (!schoolId) {
      return res.status(400).json({ error: "User is not linked to a school." });
    }

    if (req.method === "GET") {
      const result = await pool.query(
        `SELECT
           q.id,
           q.title,
           q."subjectId" AS "subjectId",
           q."timeLimit" AS "timeLimit",
           q."passingScore" AS "passingScore",
           q."maxScore" AS "maxScore",
           q.published AS "isPublished",
           q."createdAt" AS "createdAt",
           q."createdAt" AS "updatedAt",
           COALESCE(
             json_agg(
               json_build_object(
                 'id', qu.id,
                 'question', qu.text,
                 'type', qu.type,
                 'options', CASE WHEN qu.options IS NULL OR qu.options = '' THEN ARRAY[]::text[] ELSE string_to_array(qu.options, '||') END,
                 'correctAnswer', qu."correctAnswer"::text,
                 'points', qu.points
               )
             ) FILTER (WHERE qu.id IS NOT NULL),
             '[]'::json
           ) AS questions
         FROM quizzes q
         INNER JOIN lessons l ON l.id = q."lessonId"
         LEFT JOIN questions qu ON qu."quizId" = q.id
         WHERE l."schoolId" = $1
         GROUP BY q.id
         ORDER BY q."createdAt" DESC`,
        [schoolId]
      );

      return res.status(200).json(result.rows);
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      if (!body.title || !body.subjectId || !Array.isArray(body.questions) || body.questions.length === 0) {
        return res.status(400).json({ error: "Quiz title, subject, and questions are required." });
      }

      const lessonResult = await pool.query(
        `SELECT id FROM lessons WHERE "schoolId" = $1 AND "subjectId" = $2 ORDER BY "createdAt" ASC LIMIT 1`,
        [schoolId, body.subjectId]
      );

      const lessonId = lessonResult.rows[0]?.id;
      if (!lessonId) {
        return res.status(400).json({ error: "Create a lesson for this subject before creating a quiz." });
      }

      const quizId = createId();
      await pool.query(
        `INSERT INTO quizzes (
           id, title, "lessonId", "subjectId", "timeLimit", "passingScore", "maxScore", published, "createdAt"
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now())`,
        [
          quizId,
          body.title,
          lessonId,
          body.subjectId,
          body.timeLimit || null,
          body.passingScore || null,
          body.maxScore || 100,
          Boolean(body.isPublished),
        ]
      );

      for (const question of body.questions) {
        await pool.query(
          `INSERT INTO questions (id, text, options, "correctAnswer", points, "quizId", type)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            createId(),
            question.question,
            Array.isArray(question.options) ? question.options.join("||") : "",
            Number.parseInt(question.correctAnswer || "0", 10) || 0,
            question.points || 1,
            quizId,
            question.type || "multiple_choice",
          ]
        );
      }

      return res.status(201).json({ id: quizId });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    console.error("[admin/api/v1/quizzes] failed", error);
    return res.status(500).json({ error: "Failed to load quizzes." });
  }
}
