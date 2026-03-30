import crypto from "crypto";
import { pool } from "./db";

export const DEFAULT_UGANDA_LEVELS = [
  { code: "PP1", name: "Pre-Primary 1", level: 1, type: "PRE_PRIMARY" },
  { code: "PP2", name: "Pre-Primary 2", level: 2, type: "PRE_PRIMARY" },
  { code: "PP3", name: "Pre-Primary 3", level: 3, type: "PRE_PRIMARY" },
  { code: "P1", name: "Primary 1", level: 4, type: "PRIMARY" },
  { code: "P2", name: "Primary 2", level: 5, type: "PRIMARY" },
  { code: "P3", name: "Primary 3", level: 6, type: "PRIMARY" },
  { code: "P4", name: "Primary 4", level: 7, type: "PRIMARY" },
  { code: "P5", name: "Primary 5", level: 8, type: "PRIMARY" },
  { code: "P6", name: "Primary 6", level: 9, type: "PRIMARY" },
  { code: "P7", name: "Primary 7", level: 10, type: "PRIMARY" },
  { code: "S1", name: "Secondary 1", level: 11, type: "LOWER_SECONDARY" },
  { code: "S2", name: "Secondary 2", level: 12, type: "LOWER_SECONDARY" },
  { code: "S3", name: "Secondary 3", level: 13, type: "LOWER_SECONDARY" },
  { code: "S4", name: "Secondary 4", level: 14, type: "LOWER_SECONDARY" },
  { code: "S5", name: "Secondary 5", level: 15, type: "UPPER_SECONDARY" },
  { code: "S6", name: "Secondary 6", level: 16, type: "UPPER_SECONDARY" },
];

let schemaReady: Promise<void> | null = null;

export const createId = () => crypto.randomBytes(12).toString("hex");

export async function ensureAdminSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await pool.query(`
        ALTER TABLE levels ADD COLUMN IF NOT EXISTS code text;
        ALTER TABLE levels ADD COLUMN IF NOT EXISTS level integer DEFAULT 0;
        ALTER TABLE levels ADD COLUMN IF NOT EXISTS type text DEFAULT 'PRIMARY';
        ALTER TABLE subjects ADD COLUMN IF NOT EXISTS description text;
        ALTER TABLE subjects ADD COLUMN IF NOT EXISTS color text;
        ALTER TABLE lessons ADD COLUMN IF NOT EXISTS duration integer;
        ALTER TABLE lessons ADD COLUMN IF NOT EXISTS "order" integer;
        ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS "subjectId" text;
        ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS "timeLimit" integer;
        ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS "passingScore" integer;
        ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS "maxScore" integer DEFAULT 100;
        ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS published boolean DEFAULT false;
        ALTER TABLE questions ADD COLUMN IF NOT EXISTS type text DEFAULT 'multiple_choice';
        CREATE TABLE IF NOT EXISTS classes (
          id text PRIMARY KEY,
          name text NOT NULL,
          code text,
          grade text,
          capacity integer DEFAULT 30,
          "schoolId" text NOT NULL,
          "teacherId" text,
          "createdAt" timestamptz DEFAULT now(),
          "updatedAt" timestamptz DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS live_sessions (
          id text PRIMARY KEY,
          title text NOT NULL,
          description text,
          "classId" text NOT NULL,
          "teacherId" text NOT NULL,
          "scheduledAt" timestamptz NOT NULL,
          duration integer DEFAULT 60,
          status text DEFAULT 'SCHEDULED',
          "meetingUrl" text,
          "participantCount" integer DEFAULT 0,
          "schoolId" text NOT NULL,
          "createdAt" timestamptz DEFAULT now(),
          "updatedAt" timestamptz DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS assignments (
          id text PRIMARY KEY,
          title text NOT NULL,
          description text,
          "lessonId" text,
          "dueDate" timestamptz,
          "maxScore" integer DEFAULT 100,
          "teacherId" text,
          "schoolId" text NOT NULL,
          "createdAt" timestamptz DEFAULT now(),
          "updatedAt" timestamptz DEFAULT now()
        );
      `);
    })();
  }

  await schemaReady;
}

export async function getUserContext(userId: string) {
  await ensureAdminSchema();
  const result = await pool.query(
    `SELECT
       u.id,
       u.name,
       u.email,
       u.role,
       u."schoolId" AS "schoolId",
       u."isActive" AS "isActive",
       t.id AS "teacherProfileId"
     FROM users u
     LEFT JOIN teachers t ON t."userId" = u.id
     WHERE u.id = $1
     LIMIT 1`,
    [userId]
  );

  return result.rows[0] ?? null;
}

export function isAdminRole(role?: string) {
  return role === "SCHOOL_ADMIN" || role === "SUPER_ADMIN";
}
