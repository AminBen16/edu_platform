import type { NextApiRequest, NextApiResponse } from "next";
import { requireAuth } from "../../../../lib/server-auth";
import { getUserContext } from "../../../../lib/admin-data";
import { pool } from "../../../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }

  const auth = await requireAuth(req, res);
  if (!auth?.userId) {
    return;
  }

  const currentUser = await getUserContext(auth.userId);
  const schoolId = currentUser?.schoolId ?? auth.schoolId;
  if (!schoolId) {
    return res.status(400).json({ error: "User is not linked to a school." });
  }

  const result = await pool.query(
    `SELECT id, name, slug, type, logo, website, "createdAt", "updatedAt"
     FROM schools
     WHERE id = $1
     LIMIT 1`,
    [schoolId]
  );

  if (!result.rows[0]) {
    return res.status(404).json({ error: "School not found." });
  }

  return res.status(200).json(result.rows[0]);
}
