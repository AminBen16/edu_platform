"use strict";
// apps/api/src/routes/upload.ts
// PATCH 2 CRIT-002/CRIT-003: R2 storage only (no fs, no Firebase/Supabase)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const storageService_js_1 = __importDefault(require("../services/storageService.js"));
const router = (0, express_1.Router)();
// Multer memory storage (Vercel safe)
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});
// POST /upload/file - Upload via R2
router.post('/file', auth_1.protect, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    try {
        const user = req.user;
        const result = await storageService_js_1.default.storeFile({
            file: req.file.buffer,
            fileName: `${user.schoolId}/${Date.now()}_${req.file.originalname}`,
            contentType: req.file.mimetype
        });
        res.status(201).json({
            url: result.url,
            key: result.key,
            message: 'File uploaded to R2 successfully (CRIT-002 fixed)'
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed - check R2 env vars (CRIT-002)' });
    }
});
exports.default = router;
