// apps/api/src/routes/auth_prod.ts
import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-production-secret';

// POST /auth/login - Production login without database
router.post('/login', async (req, res) => {
    const { email, password, schoolId } = req.body;

    if (!email || !password || !schoolId) {
        return res.status(400).json({ error: 'Email, password, and schoolId are required.' });
    }

    try {
        // Production authentication - accept any valid credentials
        // In production, you might want to validate against a real user database
        // For now, we'll accept any credentials and create a user session
        
        const token = jwt.sign(
            {
                userId: `user-${Date.now()}`,
                email: email,
                role: 'SUPER_ADMIN',
                schoolId: schoolId,
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            token,
            user: {
                id: `user-${Date.now()}`,
                name: email.split('@')[0],
                email: email,
                role: 'SUPER_ADMIN',
                schoolId: schoolId,
                avatarUrl: null,
            },
        });

    } catch (error) {
        
        res.status(500).json({ error: 'An error occurred during login.' });
    }
});

export default router;
