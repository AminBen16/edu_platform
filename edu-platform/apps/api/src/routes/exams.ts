// apps/api/src/routes/exams.ts
import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
    res.json({ message: 'Exams endpoint' });
});

export default router;