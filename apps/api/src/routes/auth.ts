// apps/api/src/routes/auth.ts
import { Router } from 'express';
import prisma from 'db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from 'db';

const router = Router();

const JWT_SECRET = process.env.NEXTAUTH_SECRET;

if (!JWT_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required');
}

// POST /auth/login - User login
router.post('/login', async (req, res) => {
    const { email, password, schoolId } = req.body;

    if (!email || !password || !schoolId) {
        return res.status(400).json({ error: 'Email, password, and schoolId are required.' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                email_schoolId: {
                    email,
                    schoolId,
                }
            },
        });

        if (!user || !user.passwordHash) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role,
                schoolId: user.schoolId,
            },
            JWT_SECRET,
            { expiresIn: '7d' } // Token expires in 7 days
        );

        res.status(200).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                schoolId: user.schoolId,
                avatarUrl: user.avatarUrl,
            },
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred during login.' });
    }
});

// POST /auth/register - User registration
router.post('/register', async (req, res) => {
    const { name, email, password, schoolId } = req.body;

    if (!name || !email || !password || !schoolId) {
        return res.status(400).json({ error: 'Name, email, password and schoolId are required.' });
    }

    try {
        // Check if school exists
        const school = await prisma.school.findUnique({ where: { id: schoolId } });
        if (!school) {
            return res.status(400).json({ error: 'School not found.' });
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                email_schoolId: {
                    email,
                    schoolId,
                }
            },
        });

        if (existingUser) {
            return res.status(409).json({ error: 'User already exists in this school.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                schoolId,
                role: Role.STUDENT, // Default role for new sign-ups
            },
        });

        res.status(201).json({
            message: 'User registered successfully.',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred during registration.' });
    }
});

export default router;
