import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pool } from "../../../lib/db";
import { requireAuth } from "../../../lib/server-auth";
import {
  DEFAULT_UGANDA_LEVELS,
  createId,
  ensureAdminSchema,
  getUserContext,
  isAdminRole,
} from "../../../lib/admin-data";

const parseBody = (req: NextApiRequest) =>
  typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

async function getContext(req: NextApiRequest, res: NextApiResponse) {
  const auth = await requireAuth(req, res);
  if (!auth?.userId) return null;
  const user = await getUserContext(auth.userId);
  if (!user?.schoolId) {
    res.status(400).json({ error: "User is not linked to a school." });
    return null;
  }
  return { auth, user, schoolId: user.schoolId };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await ensureAdminSchema();
  const slug = Array.isArray(req.query.slug) ? req.query.slug : [];
  const route = slug.join("/");

  try {
    if (route === "analytics" && req.method === "GET") return handleAnalytics(req, res);
    if (route === "subjects") return handleSubjects(req, res);
    if (slug[0] === "subjects" && slug[1]) return handleSubjectById(req, res, slug[1]);
    if (route === "levels") return handleLevels(req, res);
    if (route === "levels/initialize-uganda" && req.method === "POST") return handleInitializeLevels(req, res);
    if (slug[0] === "levels" && slug[1]) return handleLevelById(req, res, slug[1]);
    if (route === "classes") return handleClasses(req, res);
    if (slug[0] === "classes" && slug[1]) return handleClassById(req, res, slug[1]);
    if (route === "live-sessions") return handleLiveSessions(req, res);
    if (slug[0] === "live-sessions" && slug[1]) return handleLiveSessionById(req, res, slug[1]);
    if (route === "assignments") return handleAssignments(req, res);
    if (slug[0] === "assignments" && slug[1]) return handleAssignmentById(req, res, slug[1]);
    if (route === "messages/conversations" && req.method === "GET") return handleConversations(req, res);
    if (slug[0] === "messages" && slug[1] === "read" && slug[2] && req.method === "PUT") return handleReadMessages(req, res, slug[2]);
    if (route === "messages" && req.method === "POST") return handleSendMessage(req, res);
    if (slug[0] === "messages" && slug[1] && req.method === "GET") return handleMessages(req, res, slug[1]);
    if (route === "auth/invite" && req.method === "POST") return handleInvite(req, res);
    if (slug[0] === "auth" && slug[1] === "validate" && slug[2] && req.method === "GET") return handleValidateInvitation(req, res, slug[2]);
    if (route === "auth/register" && req.method === "POST") return handleRegister(req, res);
    if (route === "auth/bootstrap-status" && req.method === "GET") return handleBootstrapStatus(res);
    if (route === "auth/bootstrap" && req.method === "POST") return handleBootstrap(req, res);
    if (slug[0] === "schools" && slug[1] && slug[2] === "subjects" && req.method === "POST") return handleSchoolSubjects(req, res, slug[1]);
    if (slug[0] === "download" && slug[1] && slug[2]) return handleDownload(req, res, slug[1], slug[2], slug[3]);
    if (slug[0] === "lessons" && slug[1]) return handleLessonById(req, res, slug[1]);
    if (slug[0] === "quizzes" && slug[1]) return handleQuizById(req, res, slug[1]);

    return res.status(404).json({ error: "Route not found." });
  } catch (error) {
    console.error("[admin/api/v1/catchall] failed", route, error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function handleAnalytics(req: NextApiRequest, res: NextApiResponse) {
  const context = await getContext(req, res);
  if (!context) return;

  const [userStats, lessonStats, quizStats] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS "totalUsers", COUNT(*) FILTER (WHERE "isActive" = true)::int AS "activeUsers" FROM users WHERE "schoolId" = $1`, [context.schoolId]),
    pool.query(`SELECT COUNT(*)::int AS "totalLessons", COUNT(*) FILTER (WHERE published = true)::int AS "publishedLessons" FROM lessons WHERE "schoolId" = $1`, [context.schoolId]),
    pool.query(`SELECT COUNT(*)::int AS "totalQuizzes", COUNT(*) FILTER (WHERE published = true)::int AS "publishedQuizzes" FROM quizzes q INNER JOIN lessons l ON l.id = q."lessonId" WHERE l."schoolId" = $1`, [context.schoolId]),
  ]);

  const activity = await pool.query(
    `SELECT * FROM (
       SELECT id, 'USER' AS type, COALESCE(name, email) AS description, "createdAt" AS timestamp, id AS "userId", name AS "userName"
       FROM users WHERE "schoolId" = $1
       UNION ALL
       SELECT id, 'LESSON' AS type, title AS description, "createdAt" AS timestamp, NULL::text AS "userId", NULL::text AS "userName"
       FROM lessons WHERE "schoolId" = $1
       UNION ALL
       SELECT q.id, 'QUIZ' AS type, q.title AS description, q."createdAt" AS timestamp, NULL::text AS "userId", NULL::text AS "userName"
       FROM quizzes q INNER JOIN lessons l ON l.id = q."lessonId" WHERE l."schoolId" = $1
     ) items ORDER BY timestamp DESC LIMIT 10`,
    [context.schoolId]
  );

  return res.status(200).json({
    ...userStats.rows[0],
    ...lessonStats.rows[0],
    ...quizStats.rows[0],
    totalClasses: 0,
    totalSchools: 1,
    recentActivity: activity.rows,
  });
}

async function handleSubjects(req: NextApiRequest, res: NextApiResponse) {
  const context = await getContext(req, res);
  if (!context) return;
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed." });
  const result = await pool.query(`SELECT id, name, code, description, color, "schoolId", "createdAt", "updatedAt" FROM subjects WHERE "schoolId" = $1 ORDER BY name ASC`, [context.schoolId]);
  return res.status(200).json(result.rows);
}

async function handleSubjectById(req: NextApiRequest, res: NextApiResponse, id: string) {
  const context = await getContext(req, res);
  if (!context) return;
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed." });
  await pool.query(`DELETE FROM subjects WHERE id = $1 AND "schoolId" = $2`, [id, context.schoolId]);
  return res.status(204).end();
}

async function handleSchoolSubjects(req: NextApiRequest, res: NextApiResponse, schoolId: string) {
  const context = await getContext(req, res);
  if (!context) return;
  const body = parseBody(req);
  const subjects = Array.isArray(body.subjects) ? body.subjects : [];
  if (!subjects.length) return res.status(400).json({ error: "Subjects are required." });

  const levelResult = await pool.query(`SELECT id FROM levels WHERE "schoolId" = $1 ORDER BY level ASC NULLS LAST, name ASC LIMIT 1`, [schoolId]);
  let levelId = levelResult.rows[0]?.id;
  if (!levelId) {
    levelId = createId();
    await pool.query(`INSERT INTO levels (id, name, code, level, type, "schoolId") VALUES ($1, 'General', 'GEN', 1, 'PRIMARY', $2)`, [levelId, schoolId]);
  }

  const created = [];
  for (const subject of subjects) {
    const result = await pool.query(
      `INSERT INTO subjects (id, name, code, description, color, "levelId", "schoolId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
       RETURNING id, name, code, description, color, "schoolId"`,
      [createId(), subject.name, subject.code || null, subject.description || null, subject.color || "#007bff", levelId, schoolId]
    );
    created.push(result.rows[0]);
  }

  return res.status(201).json(created);
}

async function handleLevels(req: NextApiRequest, res: NextApiResponse) {
  const context = await getContext(req, res);
  if (!context) return;
  if (req.method === "GET") {
    const result = await pool.query(`SELECT l.id, l.code, l.name, l.level, l.type, json_build_object('classes', 0) AS "_count" FROM levels l WHERE l."schoolId" = $1 ORDER BY l.level ASC NULLS LAST, l.name ASC`, [context.schoolId]);
    return res.status(200).json(result.rows);
  }
  if (req.method === "POST") {
    const body = parseBody(req);
    const result = await pool.query(`INSERT INTO levels (id, code, name, level, type, "schoolId") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, code, name, level, type`, [createId(), body.code, body.name, body.level || 0, body.type || "PRIMARY", context.schoolId]);
    return res.status(201).json(result.rows[0]);
  }
  return res.status(405).json({ error: "Method not allowed." });
}

async function handleInitializeLevels(req: NextApiRequest, res: NextApiResponse) {
  const context = await getContext(req, res);
  if (!context) return;
  const existing = await pool.query(`SELECT COUNT(*)::int AS count FROM levels WHERE "schoolId" = $1`, [context.schoolId]);
  if (existing.rows[0].count === 0) {
    for (const level of DEFAULT_UGANDA_LEVELS) {
      await pool.query(`INSERT INTO levels (id, code, name, level, type, "schoolId") VALUES ($1, $2, $3, $4, $5, $6)`, [createId(), level.code, level.name, level.level, level.type, context.schoolId]);
    }
  }
  const result = await pool.query(`SELECT id, code, name, level, type, json_build_object('classes', 0) AS "_count" FROM levels WHERE "schoolId" = $1 ORDER BY level ASC`, [context.schoolId]);
  return res.status(200).json({ levels: result.rows });
}

async function handleLevelById(req: NextApiRequest, res: NextApiResponse, id: string) {
  const context = await getContext(req, res);
  if (!context) return;
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed." });
  await pool.query(`DELETE FROM levels WHERE id = $1 AND "schoolId" = $2`, [id, context.schoolId]);
  return res.status(204).end();
}

async function handleClasses(req: NextApiRequest, res: NextApiResponse) {
  const context = await getContext(req, res);
  if (!context) return;
  if (req.method === "GET") {
    const result = await pool.query(
      `SELECT c.id, c.name, c.code, c.grade, c.capacity, c."schoolId",
       CASE WHEN c."teacherId" IS NULL THEN NULL ELSE json_build_object('id', t.id, 'user', json_build_object('id', u.id, 'name', u.name, 'email', u.email)) END AS teacher,
       json_build_object('enrollments', 0) AS "_count", c."createdAt" AS "createdAt", c."updatedAt" AS "updatedAt"
       FROM classes c
       LEFT JOIN teachers t ON t.id = c."teacherId"
       LEFT JOIN users u ON u.id = t."userId"
       WHERE c."schoolId" = $1
       ORDER BY c."createdAt" DESC`,
      [context.schoolId]
    );
    return res.status(200).json(result.rows);
  }
  if (req.method === "POST") {
    const body = parseBody(req);
    const result = await pool.query(`INSERT INTO classes (id, name, code, grade, capacity, "teacherId", "schoolId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now()) RETURNING id`, [createId(), body.name, body.code || null, body.grade || null, body.capacity || 30, body.teacherId || null, context.schoolId]);
    return res.status(201).json(result.rows[0]);
  }
  return res.status(405).json({ error: "Method not allowed." });
}

async function handleClassById(req: NextApiRequest, res: NextApiResponse, id: string) {
  const context = await getContext(req, res);
  if (!context) return;
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed." });
  await pool.query(`DELETE FROM classes WHERE id = $1 AND "schoolId" = $2`, [id, context.schoolId]);
  return res.status(204).end();
}

async function handleLiveSessions(req: NextApiRequest, res: NextApiResponse) {
  const context = await getContext(req, res);
  if (!context) return;
  if (req.method === "GET") {
    const result = await pool.query(`SELECT s.id, s.title, s.description, s."classId" AS "classId", c.name AS "className", s."teacherId" AS "teacherId", u.name AS "teacherName", s."scheduledAt" AS "scheduledAt", s.duration, s.status, s."meetingUrl" AS "meetingUrl", s."participantCount" AS "participantCount", s."createdAt" AS "createdAt" FROM live_sessions s LEFT JOIN classes c ON c.id = s."classId" LEFT JOIN users u ON u.id = s."teacherId" WHERE s."schoolId" = $1 ORDER BY s."scheduledAt" DESC`, [context.schoolId]);
    return res.status(200).json(result.rows);
  }
  if (req.method === "POST") {
    const body = parseBody(req);
    const result = await pool.query(`INSERT INTO live_sessions (id, title, description, "classId", "teacherId", "scheduledAt", duration, status, "meetingUrl", "participantCount", "schoolId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, 'SCHEDULED', $8, 0, $9, now(), now()) RETURNING id`, [createId(), body.title, body.description || null, body.classId, body.teacherId, body.scheduledAt, body.duration || 60, body.meetingUrl || null, context.schoolId]);
    return res.status(201).json(result.rows[0]);
  }
  return res.status(405).json({ error: "Method not allowed." });
}

async function handleLiveSessionById(req: NextApiRequest, res: NextApiResponse, id: string) {
  const context = await getContext(req, res);
  if (!context) return;
  if (req.method === "DELETE") {
    await pool.query(`DELETE FROM live_sessions WHERE id = $1 AND "schoolId" = $2`, [id, context.schoolId]);
    return res.status(204).end();
  }
  if (req.method === "PUT") {
    const body = parseBody(req);
    await pool.query(`UPDATE live_sessions SET status = $1, "updatedAt" = now() WHERE id = $2 AND "schoolId" = $3`, [body.status, id, context.schoolId]);
    return res.status(200).json({ id, status: body.status });
  }
  return res.status(405).json({ error: "Method not allowed." });
}

async function handleAssignments(req: NextApiRequest, res: NextApiResponse) {
  const context = await getContext(req, res);
  if (!context) return;
  if (req.method === "GET") {
    const result = await pool.query(
      `SELECT
         a.id, a.title, a.description, a."lessonId" AS "lessonId", a."dueDate" AS "dueDate",
         a."maxScore" AS "maxScore", a."teacherId" AS "teacherId",
         a."createdAt" AS "createdAt", a."updatedAt" AS "updatedAt",
         '[]'::json AS submissions
       FROM assignments a
       WHERE a."schoolId" = $1
       ORDER BY a."createdAt" DESC`,
      [context.schoolId]
    );
    return res.status(200).json({ assignments: result.rows });
  }
  if (req.method === "POST") {
    const body = parseBody(req);
    const result = await pool.query(
      `INSERT INTO assignments (
         id, title, description, "lessonId", "dueDate", "maxScore", "teacherId", "schoolId", "createdAt", "updatedAt"
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), now())
       RETURNING id`,
      [
        createId(),
        body.title,
        body.description || null,
        body.lessonId || null,
        body.dueDate || null,
        body.maxScore || 100,
        context.user.teacherProfileId || null,
        context.schoolId,
      ]
    );
    return res.status(201).json(result.rows[0]);
  }
  return res.status(405).json({ error: "Method not allowed." });
}

async function handleAssignmentById(req: NextApiRequest, res: NextApiResponse, id: string) {
  const context = await getContext(req, res);
  if (!context) return;
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed." });
  await pool.query(`DELETE FROM assignments WHERE id = $1 AND "schoolId" = $2`, [id, context.schoolId]);
  return res.status(204).end();
}

async function handleConversations(req: NextApiRequest, res: NextApiResponse) {
  const context = await getContext(req, res);
  if (!context) return;
  const result = await pool.query(
    `SELECT partner.id AS "userId",
       json_build_object('id', partner.id, 'name', partner.name, 'email', partner.email, 'role', partner.role, 'avatarUrl', NULL) AS user,
       json_build_object('id', latest.id, 'senderId', latest."senderId", 'receiverId', latest."receiverId", 'content', latest.content, 'timestamp', latest."createdAt", 'isRead', latest.read) AS "lastMessage",
       COALESCE(unread.count, 0) AS "unreadCount"
     FROM (SELECT DISTINCT CASE WHEN m."senderId" = $1 THEN m."receiverId" ELSE m."senderId" END AS partner_id FROM messages m WHERE m."senderId" = $1 OR m."receiverId" = $1) partners
     JOIN users partner ON partner.id = partners.partner_id
     LEFT JOIN LATERAL (SELECT * FROM messages m WHERE (m."senderId" = $1 AND m."receiverId" = partner.id) OR (m."senderId" = partner.id AND m."receiverId" = $1) ORDER BY m."createdAt" DESC LIMIT 1) latest ON true
     LEFT JOIN LATERAL (SELECT COUNT(*)::int AS count FROM messages m WHERE m."senderId" = partner.id AND m."receiverId" = $1 AND m.read = false) unread ON true
     ORDER BY latest."createdAt" DESC NULLS LAST`,
    [context.user.id]
  );
  return res.status(200).json(result.rows);
}

async function handleMessages(req: NextApiRequest, res: NextApiResponse, otherUserId: string) {
  const context = await getContext(req, res);
  if (!context) return;
  const result = await pool.query(`SELECT id, "senderId" AS "senderId", "receiverId" AS "receiverId", content, "createdAt" AS timestamp, read AS "isRead" FROM messages WHERE ("senderId" = $1 AND "receiverId" = $2) OR ("senderId" = $2 AND "receiverId" = $1) ORDER BY "createdAt" ASC`, [context.user.id, otherUserId]);
  return res.status(200).json(result.rows);
}

async function handleReadMessages(req: NextApiRequest, res: NextApiResponse, otherUserId: string) {
  const context = await getContext(req, res);
  if (!context) return;
  await pool.query(`UPDATE messages SET read = true WHERE "senderId" = $1 AND "receiverId" = $2`, [otherUserId, context.user.id]);
  return res.status(200).json({ success: true });
}

async function handleSendMessage(req: NextApiRequest, res: NextApiResponse) {
  const context = await getContext(req, res);
  if (!context) return;
  const body = parseBody(req);
  const result = await pool.query(`INSERT INTO messages (id, content, read, "senderId", "receiverId", "createdAt") VALUES ($1, $2, false, $3, $4, now()) RETURNING id, "senderId" AS "senderId", "receiverId" AS "receiverId", content, "createdAt" AS timestamp, read AS "isRead"`, [createId(), body.content, context.user.id, body.receiverId]);
  return res.status(201).json(result.rows[0]);
}

async function handleInvite(req: NextApiRequest, res: NextApiResponse) {
  const context = await getContext(req, res);
  if (!context || !isAdminRole(context.user.role)) return res.status(403).json({ error: "Not authorized." });
  const body = parseBody(req);
  const code = crypto.randomBytes(24).toString("hex");
  const result = await pool.query(`INSERT INTO invitations (id, email, name, role, "schoolId", code, used, "expiresAt", "createdBy") VALUES ($1, $2, $3, $4, $5, $6, false, now() + interval '7 days', $7) RETURNING id, code`, [createId(), String(body.email).toLowerCase(), body.name, body.role, context.schoolId, code, context.user.id]);
  return res.status(201).json({ message: "Invitation created", ...result.rows[0] });
}

async function handleValidateInvitation(req: NextApiRequest, res: NextApiResponse, code: string) {
  const result = await pool.query(`SELECT id, email, name, role, "schoolId", used, "expiresAt" FROM invitations WHERE code = $1 LIMIT 1`, [code]);
  const invitation = result.rows[0];
  if (!invitation || invitation.used || new Date(invitation.expiresAt) < new Date()) return res.status(404).json({ error: "Invalid or expired invitation." });
  return res.status(200).json(invitation);
}

async function handleRegister(req: NextApiRequest, res: NextApiResponse) {
  const body = parseBody(req);
  const invitationCode = Array.isArray(body.invitationCode) ? body.invitationCode[0] : body.invitationCode;
  const invitationResult = await pool.query(`SELECT id, email, role, "schoolId", used, "expiresAt" FROM invitations WHERE code = $1 LIMIT 1`, [invitationCode]);
  const invitation = invitationResult.rows[0];
  if (!invitation || invitation.used || new Date(invitation.expiresAt) < new Date()) return res.status(400).json({ error: "Invalid or expired invitation." });
  const userId = createId();
  const passwordHash = await bcrypt.hash(body.password, 12);
  await pool.query(`INSERT INTO users (id, name, email, password, role, "isActive", "schoolId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, true, $6, now(), now())`, [userId, body.name, String(body.email).toLowerCase(), passwordHash, invitation.role, invitation.schoolId]);
  if (invitation.role === "TEACHER") await pool.query(`INSERT INTO teachers (id, "userId", "schoolId", "createdAt", "updatedAt") VALUES ($1, $2, $3, now(), now())`, [createId(), userId, invitation.schoolId]);
  if (invitation.role === "STUDENT") await pool.query(`INSERT INTO students (id, "userId", "schoolId", "createdAt", "updatedAt") VALUES ($1, $2, $3, now(), now())`, [createId(), userId, invitation.schoolId]);
  await pool.query(`UPDATE invitations SET used = true, "usedAt" = now() WHERE id = $1`, [invitation.id]);
  return res.status(201).json({ success: true });
}

async function handleBootstrapStatus(res: NextApiResponse) {
  const count = await pool.query(`SELECT COUNT(*)::int AS count FROM users`);
  return res.status(200).json({ canBootstrap: count.rows[0].count === 0 });
}

async function handleBootstrap(req: NextApiRequest, res: NextApiResponse) {
  const body = parseBody(req);
  const count = await pool.query(`SELECT COUNT(*)::int AS count FROM users`);
  if (count.rows[0].count > 0) return res.status(409).json({ error: "Bootstrap unavailable." });
  const schoolId = createId();
  const userId = createId();
  const passwordHash = await bcrypt.hash(body.password, 12);
  const slug = String(body.schoolName || "school").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  await pool.query(`INSERT INTO schools (id, name, slug, type, "createdAt", "updatedAt") VALUES ($1, $2, $3, 'PRIMARY', now(), now())`, [schoolId, body.schoolName, slug]);
  await pool.query(`INSERT INTO users (id, name, email, password, role, "isActive", "schoolId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, 'SCHOOL_ADMIN', true, $5, now(), now())`, [userId, body.name, String(body.email).toLowerCase(), passwordHash, schoolId]);
  return res.status(201).json({ success: true });
}

async function handleDownload(req: NextApiRequest, res: NextApiResponse, kind: string, id: string, extra?: string) {
  const context = await getContext(req, res);
  if (!context || req.method !== "GET") return;

  if (kind === "lesson") {
    const result = await pool.query(`SELECT title, description, content FROM lessons WHERE id = $1 AND "schoolId" = $2 LIMIT 1`, [id, context.schoolId]);
    if (!result.rows[0]) return res.status(404).json({ error: "Lesson not found." });
    const lesson = result.rows[0];
    res.setHeader("Content-Type", "application/octet-stream");
    return res.status(200).send(`Lesson: ${lesson.title}\n\n${lesson.description || ""}\n\n${lesson.content || ""}`);
  }

  if (kind === "quiz") {
    const result = await pool.query(
      `SELECT q.title, COALESCE(json_agg(json_build_object('text', qu.text, 'points', qu.points)) FILTER (WHERE qu.id IS NOT NULL), '[]'::json) AS questions
       FROM quizzes q
       INNER JOIN lessons l ON l.id = q."lessonId"
       LEFT JOIN questions qu ON qu."quizId" = q.id
       WHERE q.id = $1 AND l."schoolId" = $2
       GROUP BY q.id`,
      [id, context.schoolId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: "Quiz not found." });
    const quiz = result.rows[0];
    res.setHeader("Content-Type", "application/octet-stream");
    return res.status(200).send(`Quiz: ${quiz.title}\n\n${JSON.stringify(quiz.questions, null, 2)}`);
  }

  if (kind === "assignment") {
    if (extra === "submissions") {
      res.setHeader("Content-Type", "application/octet-stream");
      return res.status(200).send("No submissions available yet.");
    }

    const result = await pool.query(`SELECT title, description, "maxScore" FROM assignments WHERE id = $1 AND "schoolId" = $2 LIMIT 1`, [id, context.schoolId]);
    if (!result.rows[0]) return res.status(404).json({ error: "Assignment not found." });
    const assignment = result.rows[0];
    res.setHeader("Content-Type", "application/octet-stream");
    return res.status(200).send(`Assignment: ${assignment.title}\n\n${assignment.description || ""}\n\nMax Score: ${assignment.maxScore}`);
  }

  return res.status(404).json({ error: "Download route not found." });
}

async function handleLessonById(req: NextApiRequest, res: NextApiResponse, id: string) {
  const context = await getContext(req, res);
  if (!context) return;
  if (req.method === "PUT") {
    const body = parseBody(req);
    await pool.query(`UPDATE lessons SET published = COALESCE($1, published), "updatedAt" = now() WHERE id = $2 AND "schoolId" = $3`, [body.isPublished, id, context.schoolId]);
    return res.status(200).json({ id, isPublished: body.isPublished });
  }
  if (req.method === "DELETE") {
    await pool.query(`DELETE FROM lessons WHERE id = $1 AND "schoolId" = $2`, [id, context.schoolId]);
    return res.status(204).end();
  }
  return res.status(405).json({ error: "Method not allowed." });
}

async function handleQuizById(req: NextApiRequest, res: NextApiResponse, id: string) {
  const context = await getContext(req, res);
  if (!context) return;
  if (req.method === "PUT") {
    const body = parseBody(req);
    await pool.query(`UPDATE quizzes q SET published = COALESCE($1, q.published) FROM lessons l WHERE q.id = $2 AND l.id = q."lessonId" AND l."schoolId" = $3`, [body.isPublished, id, context.schoolId]);
    return res.status(200).json({ id, isPublished: body.isPublished });
  }
  if (req.method === "DELETE") {
    await pool.query(`DELETE FROM questions WHERE "quizId" = $1`, [id]);
    await pool.query(`DELETE FROM quizzes q USING lessons l WHERE q.id = $1 AND l.id = q."lessonId" AND l."schoolId" = $2`, [id, context.schoolId]);
    return res.status(204).end();
  }
  return res.status(405).json({ error: "Method not allowed." });
}
