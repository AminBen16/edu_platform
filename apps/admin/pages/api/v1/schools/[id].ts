import type { NextApiRequest, NextApiResponse } from "next";
import { pool } from "../../../../lib/db";
import { requireAuth } from "../../../../lib/server-auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const auth = await requireAuth(req, res);
  if (!auth?.userId) {
    return;
  }

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (!id) {
    return res.status(400).json({ error: "School id is required." });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, slug, type, logo, website, "createdAt" AS "createdAt", "updatedAt" AS "updatedAt"
       FROM schools
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    const school = result.rows[0];
    if (!school) {
      return res.status(404).json({ error: "School not found." });
    }

    const countsResult = await pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM students WHERE "schoolId" = $1) AS "totalStudents",
         (SELECT COUNT(*)::int FROM teachers WHERE "schoolId" = $1) AS "totalTeachers",
         (SELECT COUNT(*)::int FROM levels WHERE "schoolId" = $1) AS "totalClasses"`,
      [id]
    );

    const counts = countsResult.rows[0] ?? {
      totalStudents: 0,
      totalTeachers: 0,
      totalClasses: 0,
    };

    return res.status(200).json({
      ...school,
      code: school.slug,
      address: "",
      phone: "",
      email: "",
      principal: "",
      vicePrincipal: "",
      totalStudents: counts.totalStudents,
      totalTeachers: counts.totalTeachers,
      totalClasses: counts.totalClasses,
      academicYear: "",
      semester: "",
      timezone: "Africa/Kampala",
      gradingScale: "",
      attendancePolicy: "",
      features: {
        onlineGrading: true,
        digitalLibrary: true,
        parentPortal: true,
        studentEmail: false,
        emergencyAlerts: false,
      },
    });
  } catch (error) {
    console.error("[admin/api/v1/schools/[id]] failed", error);
    return res.status(500).json({ error: "Failed to load school." });
  }
}
