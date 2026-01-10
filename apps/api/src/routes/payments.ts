// apps/api/src/routes/payments.ts
import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
    res.json({ message: 'Payments endpoint' });
});

export default router;
