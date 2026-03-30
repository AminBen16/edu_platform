import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "../../../lib/db";
import { requireAuth } from "../../../lib/server-auth";
import { createId, ensureAdminSchema, getUserContext } from "../../../lib/admin-data";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireAuth(req, res);
  if (!auth?.userId) {
    return;
  }

  try {
    await ensureAdminSchema();
    const currentUser = await getUserContext(auth.userId);
    if (!currentUser?.isActive) {
      return res.status(401).json({ error: "User not found or inactive." });
    }

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
           id,
           title,
           description,
           content,
           type,
           "mediaUrl" AS "videoUrl",
           duration,
           "order" AS "order",
           "subjectId" AS "subjectId",
           "teacherId" AS "teacherId",
           NULL::text AS "classId",
           published AS "isPublished",
           "createdAt" AS "createdAt",
           "updatedAt" AS "updatedAt"
         FROM lessons
         WHERE "schoolId" = $1
         ORDER BY "createdAt" DESC`,
        [schoolId]
      );

      return res.status(200).json(result.rows);
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
      if (!body.title || !body.subjectId) {
        return res.status(400).json({ error: "Title and subject are required." });
      }

      let teacherId = currentUser.teacherProfileId;
      if (!teacherId) {
        const teacher = await pool.query(
          `SELECT id FROM teachers WHERE "schoolId" = $1 ORDER BY "createdAt" ASC LIMIT 1`,
          [schoolId]
        );
        teacherId = teacher.rows[0]?.id ?? null;
      }

      if (!teacherId) {
        teacherId = createId();
        await pool.query(
          `INSERT INTO teachers (id, "userId", "schoolId", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, now(), now())`,
          [teacherId, currentUser.id, schoolId]
        );
      }

      const lessonId = createId();
      const result = await pool.query(
        `INSERT INTO lessons (
           id, title, description, content, type, "mediaUrl", duration, "order",
           published, "subjectId", "schoolId", "teacherId", "createdAt", "updatedAt"
         )
         VALUES (
           $1, $2, $3, $4, $5, $6, $7, $8,
           $9, $10, $11, $12, now(), now()
         )
         RETURNING
           id, title, description, content, type, "mediaUrl" AS "videoUrl",
           duration, "order" AS "order", "subjectId" AS "subjectId",
           "teacherId" AS "teacherId", NULL::text AS "classId",
           published AS "isPublished", "createdAt" AS "createdAt", "updatedAt" AS "updatedAt"`,
        [
          lessonId,
          body.title,
          body.description || null,
          body.content || null,
          body.type === "LESSON" ? "ARTICLE" : body.type || "ARTICLE",
          body.videoUrl || null,
          body.duration || null,
          body.order || null,
          Boolean(body.isPublished),
          body.subjectId,
          schoolId,
          teacherId,
        ]
      );

      return res.status(201).json(result.rows[0]);
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed." });
  } catch (error) {
    console.error("[admin/api/v1/lessons] failed", error);
    return res.status(500).json({ error: "Failed to load lessons." });
  }
}
