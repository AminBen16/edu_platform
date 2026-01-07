"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/schools.ts
const express_1 = require("express");
const db_1 = __importDefault(require("db"));
const auth_1 = require("../middleware/auth");
const db_2 = require("db");
const router = (0, express_1.Router)();
// GET /schools - Fetches all schools (for SUPER_ADMIN) or the user's school
router.get('/', auth_1.protect, async (req, res) => {
    try {
        const user = req.user;
        let schools;
        if (user.role === db_2.Role.SUPER_ADMIN) {
            schools = await db_1.default.school.findMany({
                orderBy: { createdAt: 'desc' },
            });
        }
        else {
            // Other roles can only see their own school
            schools = await db_1.default.school.findMany({
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
router.post('/', auth_1.protect, (0, auth_1.authorize)(db_2.Role.SUPER_ADMIN), async (req, res) => {
    const { name, logoUrl } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'School name is required.' });
    }
    try {
        const newSchool = await db_1.default.school.create({
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
