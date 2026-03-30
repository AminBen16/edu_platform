// apps/api/src/routes/users.ts
import { Router } from 'express';
import { prisma } from '../config/database';
import { protect } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import { isAdminRole, normalizeRole } from '../lib/roles';

const router = Router();

// GET /users/profile - Get current user's profile
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            include: {
                school: { select: { name: true, logoUrl: true } },
                Teacher: true,
                Student: true,
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Omit password from the response
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Failed to fetch profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// PUT /users/profile - Update current user's profile
router.put('/profile', protect, async (req, res) => {
    const { name, avatarUrl } = req.body;
    try {
        const updatedUser = await prisma.user.update({
            where: { id: req.user!.id },
            data: {
                name: name || undefined,
                avatarUrl: avatarUrl || undefined,
            }
        });
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Failed to update profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// --- Admin User Management ---

// GET /users - List all users in the school (Admin only)
router.get('/', protect, async (req, res) => {
    if (!isAdminRole(req.user!.role)) {
        return res.status(403).json({ error: 'You are not authorized to view all users.' });
    }
    try {
        const users = await prisma.user.findMany({
            where: { schoolId: req.user!.schoolId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatarUrl: true,
                isActive: true,
                createdAt: true,
            }
        });
        res.json(users);
    } catch (error) {
        console.error('Failed to fetch users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// GET /users/:id - Get a specific user's details (Admin only)
router.get('/:id', protect, async (req, res) => {
    if (!isAdminRole(req.user!.role)) {
        return res.status(403).json({ error: 'You are not authorized to view this user.' });
    }
    const { id } = req.params;
    try {
        const user = await prisma.user.findFirst({
            where: { id, schoolId: req.user!.schoolId },
            select: {
                id: true, email: true, name: true, role: true, avatarUrl: true, isActive: true, createdAt: true,
                Teacher: true, 
                Student: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error(`Failed to fetch user ${id}:`, error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// POST /users - Create a new user (Admin only)
router.post('/', protect, async (req, res) => {
    if (!isAdminRole(req.user!.role)) {
        return res.status(403).json({ error: 'You are not authorized to create users.' });
    }
    const { email, name, role, password: plainPassword } = req.body;
    const normalizedRole = normalizeRole(role);
    if (!email || !name || !normalizedRole || !plainPassword) {
        return res.status(400).json({ error: 'Email, name, role, and password are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(plainPassword, 12);
        const newUser = await prisma.user.create({
            data: {
                email,
                name,
                role: normalizedRole as any,
                password: hashedPassword,
                schoolId: req.user!.schoolId,
                emailVerified: new Date(), // Admins create verified users
            }
        });

        // Create a corresponding student or teacher profile
        if (normalizedRole === "STUDENT") {
            await prisma.student.create({ data: { userId: newUser.id, schoolId: req.user!.schoolId } });
        } else if (normalizedRole === "TEACHER") {
            await prisma.teacher.create({ data: { userId: newUser.id, schoolId: req.user!.schoolId } });
        }
        
        const { password, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        console.error('Failed to create user:', error);
        // @ts-ignore
        if (error.code === 'P2002') { // Prisma unique constraint violation
            return res.status(409).json({ error: 'A user with this email already exists.' });
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// PUT /users/:id - Update a user's details (Admin only)
router.put('/:id', protect, async (req, res) => {
    if (!isAdminRole(req.user!.role)) {
        return res.status(403).json({ error: 'You are not authorized to update users.' });
    }
    const { id } = req.params;
    const { name, role, isActive } = req.body;

    try {
        const updatedUser = await prisma.user.update({
            where: { id, schoolId: req.user!.schoolId },
            data: { name, role, isActive },
        });
        const { password, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error(`Failed to update user ${id}:`, error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// DELETE /users/:id - Delete a user (Admin only)
router.delete('/:id', protect, async (req, res) => {
    if (!isAdminRole(req.user!.role)) {
        return res.status(403).json({ error: 'You are not authorized to delete users.' });
    }
    const { id } = req.params;
    
    // Prevent admin from deleting themselves
    if (id === req.user!.id) {
        return res.status(400).json({ error: "You cannot delete your own account."});
    }

    try {
        // The schema's onDelete: Cascade should handle related data
        await prisma.user.delete({
            where: { id, schoolId: req.user!.schoolId },
        });
        res.status(204).send();
    } catch (error) {
        console.error(`Failed to delete user ${id}:`, error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});


export default router;
