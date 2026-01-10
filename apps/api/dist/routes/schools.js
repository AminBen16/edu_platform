"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/schools.ts
const express_1 = require("express");
const database_1 = __importStar(require("../lib/database"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /schools - Fetches all schools (for SUPER_ADMIN) or the user's school
router.get('/', auth_1.protect, async (req, res) => {
    try {
        const user = req.user;
        let schools;
        if (user.role === database_1.Role.SUPER_ADMIN) {
            schools = await database_1.default.school.findMany({
                orderBy: { createdAt: 'desc' },
            });
        }
        else {
            // Other roles can only see their own school
            schools = await database_1.default.school.findMany({
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
router.post('/', auth_1.protect, (0, auth_1.authorize)(database_1.Role.SUPER_ADMIN), async (req, res) => {
    const { name, logoUrl } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'School name is required.' });
    }
    try {
        const newSchool = await database_1.default.school.create({
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
