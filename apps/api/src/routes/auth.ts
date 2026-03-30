// apps/api/src/routes/auth.ts
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { protect } from '../middleware/auth';
import { authRateLimit, invitationRateLimit, generalRateLimit } from '../middleware/rateLimit';
import EmailService from '../services/emailService.js';
import { isAdminRole, normalizeRole } from '../lib/roles';

const router = Router();

const JWT_SECRET = process.env.NEXTAUTH_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('NEXTAUTH_SECRET is required and must be at least 32 characters. Set in Vercel dashboard.');
}

const slugifySchoolName = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

// GET /auth/bootstrap-status - Check whether first-run setup is still available
router.get('/bootstrap-status', async (_req, res) => {
    try {
        const userCount = await prisma.user.count();
        return res.json({
            canBootstrap: userCount === 0,
            reason: userCount === 0 ? undefined : 'This deployment already has users. Sign in with an existing account.',
        });
    } catch (error) {
        console.error('Bootstrap status error:', error);
        return res.status(500).json({ error: 'Failed to determine bootstrap status.' });
    }
});

// POST /auth/bootstrap - Create the very first school and admin account
router.post('/bootstrap', async (req, res) => {
    const { schoolName, schoolSlug, name, email, password } = req.body;

    if (!schoolName || !name || !email || !password) {
        return res.status(400).json({ error: 'School name, admin name, email, and password are required.' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    try {
        const existingUsers = await prisma.user.count();
        if (existingUsers > 0) {
            return res.status(409).json({ error: 'Bootstrap is only available before the first user is created.' });
        }

        const desiredSlug = slugifySchoolName(schoolSlug || schoolName);
        const hashedPassword = await bcrypt.hash(password, 12);

        const result = await prisma.$transaction(async (tx) => {
            let finalSlug = desiredSlug || `school-${Date.now()}`;
            let suffix = 1;

            while (await tx.school.findUnique({ where: { slug: finalSlug } })) {
                finalSlug = `${desiredSlug}-${suffix++}`;
            }

            const school = await tx.school.create({
                data: {
                    name: schoolName.trim(),
                    slug: finalSlug,
                    type: 'PRIMARY',
                }
            });

            const user = await tx.user.create({
                data: {
                    email: email.trim().toLowerCase(),
                    name: name.trim(),
                    password: hashedPassword,
                    role: 'SCHOOL_ADMIN',
                    schoolId: school.id,
                    emailVerified: new Date(),
                    isActive: true,
                }
            });

            return { school, user };
        });

        const token = jwt.sign(
            { userId: result.user.id, email: result.user.email, role: result.user.role, schoolId: result.user.schoolId },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const { password: _, ...userWithoutPassword } = result.user;
        return res.status(201).json({
            message: 'Initial setup completed successfully.',
            token,
            school: result.school,
            user: userWithoutPassword,
        });
    } catch (error) {
        console.error('Bootstrap error:', error);
        // @ts-ignore
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'That email or school slug is already in use.' });
        }
        return res.status(500).json({ error: 'Failed to create the initial admin account.' });
    }
});

// GET /auth/validate/:code - Validate invitation code (rate limited)
router.get('/validate/:code', generalRateLimit, async (req, res) => {
    const { code } = req.params;
    const { email } = req.query;

    if (!code) {
        return res.status(400).json({ error: 'Invitation code is required.' });
    }

    try {
        const invitation = await prisma.invitation.findUnique({
            where: { code },
            include: {
                school: { select: { name: true, id: true } }
            }
        });

        if (!invitation) {
            return res.status(404).json({ error: 'Invalid invitation code.' });
        }

        if (invitation.used) {
            return res.status(400).json({ error: 'This invitation code has already been used.' });
        }

        if (invitation.expiresAt < new Date()) {
            return res.status(400).json({ error: 'This invitation code has expired.' });
        }

        // If email is provided, verify it matches
        if (email && invitation.email !== email) {
            return res.status(400).json({ error: 'This invitation code is for a different email address.' });
        }

        res.json({
            valid: true,
            name: invitation.name,
            role: invitation.role,
            email: invitation.email,
            school: invitation.school
        });
    } catch (error) {
        console.error('Validate invitation error:', error);
        res.status(500).json({ error: 'Failed to validate invitation.' });
    }
});

// POST /auth/login - Production-ready login (rate limited for security)
import { LoginSchema } from '../lib/validation';

router.post('/login', authRateLimit, async (req, res) => {
    let email, password, schoolId;
    try {
        ({ email, password, schoolId } = LoginSchema.parse(req.body));
    } catch (error) {
        return res.status(400).json({ error: (error as Error).message });
    }

    try {
        // Find the user by email. If multiple accounts exist, schoolId will be needed.
        const users = await prisma.user.findMany({ where: { email } });

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        let user;
        if (users.length > 1) {
            if (!schoolId) {
                return res.status(409).json({ error: 'Multiple accounts found. Please provide a school ID.' });
            }
            user = users.find((u: any) => u.schoolId === schoolId);
        } else {
            user = users[0];
        }

        if (!user || !user.password) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, schoolId: user.schoolId },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json({ token, user: userWithoutPassword });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /auth/register - Accept invitation and create user
import { RegisterSchema } from '../lib/validation';

router.post('/register', async (req, res) => {
    let email, password, name, invitationCode;
    try {
        ({ email, password, name, invitationCode } = RegisterSchema.parse(req.body));
    } catch (error) {
        return res.status(400).json({ error: (error as Error).message });
    }

    try {
        const invitation = await prisma.invitation.findFirst({
            where: { code: invitationCode, email, used: false, expiresAt: { gt: new Date() } }
        });

        if (!invitation) {
            return res.status(400).json({ error: 'Invalid or expired invitation code.' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: invitation.role,
                schoolId: invitation.schoolId,
                emailVerified: new Date(),
            }
        });

        await prisma.invitation.update({
            where: { id: invitation.id },
            data: { used: true, usedAt: new Date() }
        });
        
        // Create corresponding profile
        if(user.role === 'STUDENT') {
            await prisma.student.create({ data: { userId: user.id, schoolId: user.schoolId }});
        } else if (user.role === 'TEACHER') {
            await prisma.teacher.create({ data: { userId: user.id, schoolId: user.schoolId }});
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role, schoolId: user.schoolId },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({ token, user: userWithoutPassword });

    } catch (error) {
        console.error('Registration error:', error);
        // @ts-ignore
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'A user with this email already exists in this school.' });
        }
        res.status(500).json({ error: 'Failed to register user.' });
    }
});


// POST /auth/invite - Generate invitation (Admin only, rate limited)
router.post('/invite', protect, invitationRateLimit, async (req, res) => {
    if (!isAdminRole(req.user!.role)) {
        return res.status(403).json({ error: 'You are not authorized to invite users.' });
    }
    const { email, name, role, schoolId } = req.body;
    const normalizedRole = normalizeRole(role);

    if (!email || !name || !normalizedRole || !schoolId) {
        return res.status(400).json({ error: 'Email, name, role, and schoolId are required.' });
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email_schoolId: { email, schoolId } }
        });
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists in this school.' });
        }

        const invitationCode = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const invitation = await prisma.invitation.create({
            data: { email, name, role: normalizedRole as any, schoolId, code: invitationCode, expiresAt, createdBy: req.user!.id }
        });

        const school = await prisma.school.findUnique({ where: { id: schoolId } });
        if (school) {
            await EmailService.sendInvitationEmail(email, name, invitationCode, school.name);
        }

        res.status(201).json({ message: 'Invitation sent successfully', invitationId: invitation.id });

    } catch (error) {
        console.error('Invitation error:', error);
        res.status(500).json({ error: 'Failed to create invitation.' });
    }
});

// GET /auth/invitations - List pending invitations for a school (Admin only)
router.get('/invitations', protect, async (req, res) => {
     if (!isAdminRole(req.user!.role)) {
        return res.status(403).json({ error: 'You are not authorized to view invitations.' });
    }
    try {
        const invitations = await prisma.invitation.findMany({
            where: { schoolId: req.user!.schoolId, used: false, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' },
            include: { creator: { select: { name: true } } }
        });
        res.json(invitations);
    } catch (error) {
        console.error('Failed to fetch invitations:', error);
        res.status(500).json({ error: 'Failed to fetch invitations.' });
    }
});

// POST /auth/forgot-password - Request password reset (rate limited)
router.post('/forgot-password', authRateLimit, async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
    }

    try {
        if (!EmailService.hasDeliveryConfig()) {
            return res.status(503).json({
                error: 'Self-service password reset is not configured on this deployment. Please contact your school administrator.',
            });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // We don't want to reveal if a user exists or not, so we send a generic success message.
            return res.status(200).json({ message: 'If an account with this email exists, a password reset link has been sent.' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token,
                expiresAt,
                schoolId: user.schoolId,
            }
        });

        await EmailService.sendPasswordResetEmail(email, user.name, token);

        return res.status(200).json({ message: 'If an account with this email exists, a password reset link has been sent.' });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process password reset request.' });
    }
});

// POST /auth/reset-password - Reset password with token
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    try {
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
        });

        if (!resetToken || resetToken.expiresAt < new Date()) {
            return res.status(400).json({ error: 'Invalid or expired password reset token.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await prisma.user.update({
            where: { id: resetToken.userId },
            data: { password: hashedPassword },
        });

        await prisma.passwordResetToken.delete({
            where: { id: resetToken.id },
        });

        res.status(200).json({ message: 'Password has been reset successfully.' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password.' });
    }
});

export default router;
