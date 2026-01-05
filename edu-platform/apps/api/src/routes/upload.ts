// apps/api/src/routes/upload.ts
import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
    res.json({ message: 'Upload endpoint' });
});

export default router;