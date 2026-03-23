// apps/api/src/routes/upload.ts
// PATCH 2 CRIT-002/CRIT-003: R2 storage only (no fs, no Firebase/Supabase)

import { Router } from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth';
import StorageService from '../services/storageService.js';

const router = Router();

// Multer memory storage (Vercel safe)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// POST /upload/file - Upload via R2
router.post('/file', protect, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const user = req.user!;
    const result = await StorageService.storeFile({
      file: req.file.buffer,
      fileName: `${user.schoolId}/${Date.now()}_${req.file.originalname}`,
      contentType: req.file.mimetype
    });

    res.status(201).json({ 
      url: result.url, 
      key: result.key,
      message: 'File uploaded to R2 successfully (CRIT-002 fixed)'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed - check R2 env vars (CRIT-002)' });
  }
});

export default router;

