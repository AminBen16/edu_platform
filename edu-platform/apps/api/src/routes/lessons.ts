// apps/api/src/routes/lessons.ts
import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
    res.json({ message: 'Lessons endpoint' });
});

export default router;