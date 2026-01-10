"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/schools.ts
const express_1 = require("express");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /schools - Fetches all schools (for SUPER_ADMIN) or the user's school
router.get('/', auth_1.protect, async (req, res) => {
    try {
        const user = req.user;
        let schools;
        if (user.role === 'SUPER_ADMIN') {
            schools = await database_1.prisma.school.findMany({
                orderBy: { createdAt: 'desc' },
            });
        }
        else {
            // Other roles can only see their own school
            schools = await database_1.prisma.school.findMany({
                where: { id: user.schoolId },
            });
        }
        res.status(200).json(schools);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching schools.' });
    }
});
// POST /schools - Creates a new school (SUPER_ADMIN only)
router.post('/', auth_1.protect, (0, auth_1.authorize)('SUPER_ADMIN'), async (req, res) => {
    const { name, logoUrl } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'School name is required.' });
    }
    try {
        const newSchool = await database_1.prisma.school.create({
            data: {
                name,
                logoUrl,
            },
        });
        res.status(201).json(newSchool);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while creating the school.' });
    }
});
exports.default = router;
