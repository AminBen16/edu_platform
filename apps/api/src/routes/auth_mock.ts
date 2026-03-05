// apps/api/src/routes/auth_mock.ts
import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-for-testing';

// POST /auth/login - Mock login for development
router.post('/login', async (req, res) => {
    const { email, password, schoolId } = req.body;

    if (!email || !password || !schoolId) {
        return res.status(400).json({ error: 'Email, password, and schoolId are required.' });
    }

    // Mock authentication - accept any email/password/schoolId
    try {
        const token = jwt.sign(
            {
                userId: 'test-user-id',
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
                id: 'test-user-id',
                name: 'Test User',
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
