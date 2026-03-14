"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/upload.ts
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const supabase_js_1 = require("@supabase/supabase-js");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Multer setup for in-memory storage
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
// Supabase Storage client setup
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey) : null;
// POST /upload/file - Upload a file to Supabase Storage
router.post('/file', auth_1.protect, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    if (!supabase) {
        return res.status(500).json({ error: 'Supabase storage not configured.' });
    }
    const user = req.user;
    const bucket = 'edu-files';
    const filePath = `${user.schoolId}/${Date.now()}_${req.file.originalname}`;
    try {
        // Ensure bucket exists (idempotent)
        await supabase.storage.createBucket(bucket, { public: false }).catch(() => { });
        // Upload file
        const { data, error } = await supabase.storage.from(bucket).upload(filePath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true,
        });
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        const publicUrl = supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
        res.status(201).json({ url: publicUrl, path: filePath });
    }
    catch (err) {
        res.status(500).json({ error: 'File upload failed.' });
    }
});
exports.default = router;
