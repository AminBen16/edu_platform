// apps/api/src/routes/upload.ts
import { Router } from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { protect } from '../middleware/auth';

const router = Router();

// Multer setup for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Supabase Storage client setup
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// POST /upload/file - Upload a file to Supabase Storage
router.post('/file', protect, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }
    
    if (!supabase) {
        return res.status(500).json({ error: 'Supabase storage not configured.' });
    }
    
    const user = req.user!;
    const bucket = 'edu-files';
    const filePath = `${user.schoolId}/${Date.now()}_${req.file.originalname}`;
    try {
        // Ensure bucket exists (idempotent)
        await supabase.storage.createBucket(bucket, { public: false }).catch(() => {});
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
    } catch (err) {
        res.status(500).json({ error: 'File upload failed.' });
    }
});

export default router;