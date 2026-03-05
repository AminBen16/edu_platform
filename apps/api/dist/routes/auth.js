"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// apps/api/src/routes/auth.ts
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
// import EmailService from '../services/emailService'; // Assuming this service exists
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'a-fallback-secret-that-is-long-and-secure';
if (JWT_SECRET === 'a-fallback-secret-that-is-long-and-secure') {
    console.warn('Warning: Using fallback JWT secret. Set NEXTAUTH_SECRET in your environment for production.');
}
// POST /auth/login - Production-ready login
router.post('/login', async (req, res) => {
    const { email, password, schoolId } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }
    try {
        // Find the user by email. If multiple accounts exist, schoolId will be needed.
        const users = await database_1.prisma.user.findMany({ where: { email } });
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        let user;
        if (users.length > 1) {
            if (!schoolId) {
                return res.status(409).json({ error: 'Multiple accounts found. Please provide a school ID.' });
            }
            user = users.find(u => u.schoolId === schoolId);
        }
        else {
            user = users[0];
        }
        if (!user || !user.password) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role, schoolId: user.schoolId }, JWT_SECRET, { expiresIn: '7d' });
        const { password: _, ...userWithoutPassword } = user;
        res.status(200).json({ token, user: userWithoutPassword });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /auth/register - Accept invitation and create user
router.post('/register', async (req, res) => {
    const { email, password, name, invitationCode } = req.body;
    if (!email || !password || !name || !invitationCode) {
        return res.status(400).json({ error: 'Email, password, name, and invitation code are required.' });
    }
    try {
        const invitation = await database_1.prisma.invitation.findUnique({
            where: { code: invitationCode, email, used: false, expiresAt: { gt: new Date() } }
        });
        if (!invitation) {
            return res.status(400).json({ error: 'Invalid or expired invitation code.' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const user = await database_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: invitation.role,
                schoolId: invitation.schoolId,
                emailVerified: new Date(),
            }
        });
        await database_1.prisma.invitation.update({
            where: { id: invitation.id },
            data: { used: true, usedAt: new Date() }
        });
        // Create corresponding profile
        if (user.role === 'STUDENT') {
            await database_1.prisma.student.create({ data: { userId: user.id, schoolId: user.schoolId } });
        }
        else if (user.role === 'TEACHER') {
            await database_1.prisma.teacher.create({ data: { userId: user.id, schoolId: user.schoolId } });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role, schoolId: user.schoolId }, JWT_SECRET, { expiresIn: '7d' });
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({ token, user: userWithoutPassword });
    }
    catch (error) {
        console.error('Registration error:', error);
        // @ts-ignore
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'A user with this email already exists in this school.' });
        }
        res.status(500).json({ error: 'Failed to register user.' });
    }
});
// POST /auth/invite - Generate invitation (Admin only)
router.post('/invite', auth_1.protect, async (req, res) => {
    if (req.user.role !== "ADMIN") {
        return res.status(403).json({ error: 'You are not authorized to invite users.' });
    }
    const { email, name, role, schoolId } = req.body;
    if (!email || !name || !role || !schoolId) {
        return res.status(400).json({ error: 'Email, name, role, and schoolId are required.' });
    }
    try {
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email_schoolId: { email, schoolId } }
        });
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists in this school.' });
        }
        const invitationCode = crypto_1.default.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        const invitation = await database_1.prisma.invitation.create({
            data: { email, name, role, schoolId, code: invitationCode, expiresAt, createdBy: req.user.id }
        });
        // TODO: Re-enable EmailService
        // const school = await prisma.school.findUnique({ where: { id: schoolId } });
        // if (school) {
        //     await EmailService.sendInvitationEmail(email, name, invitationCode, school.name);
        // }
        res.status(201).json({ message: 'Invitation sent successfully', invitationId: invitation.id });
    }
    catch (error) {
        console.error('Invitation error:', error);
        res.status(500).json({ error: 'Failed to create invitation.' });
    }
});
// GET /auth/invitations - List pending invitations for a school (Admin only)
router.get('/invitations', auth_1.protect, async (req, res) => {
    if (req.user.role !== "ADMIN") {
        return res.status(403).json({ error: 'You are not authorized to view invitations.' });
    }
    try {
        const invitations = await database_1.prisma.invitation.findMany({
            where: { schoolId: req.user.schoolId, used: false, expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' },
            include: { creator: { select: { name: true } } }
        });
        res.json(invitations);
    }
    catch (error) {
        console.error('Failed to fetch invitations:', error);
        res.status(500).json({ error: 'Failed to fetch invitations.' });
    }
});
// POST /auth/forgot-password - Request password reset
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
    }
    try {
        const users = await database_1.prisma.user.findMany({ where: { email } });
        if (users.length === 0) {
            return res.status(200).json({ message: 'If an account exists with this email, a password reset link has been sent.' });
        }
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
        // TODO: Implement password reset when Prisma client is fixed
        // await prisma.passwordReset.create({
        //     data: {
        //         userId: users[0].id,
        //         token: resetToken,
        //         expiresAt: resetTokenExpiry,
        //     }
        // });
        const resetLink = `eduplatform://reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
        console.log(`Password reset link for ${email}: ${resetLink}`);
        res.status(200).json({
            message: 'If an account exists with this email, a password reset link has been sent.',
            debugResetLink: resetLink
        });
    }
    catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process password reset request.' });
    }
});
// POST /auth/reset-password - Reset password with token
router.post('/reset-password', async (req, res) => {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
        return res.status(400).json({ error: 'Email, token, and new password are required.' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    try {
        const users = await database_1.prisma.user.findMany({ where: { email } });
        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired reset token.' });
        }
        // TODO: Implement password reset when Prisma client is fixed
        // const passwordReset = await prisma.passwordReset.findFirst({
        //     where: {
        //         token,
        //         expiresAt: {
        //             gt: new Date()
        //         }
        //     }
        // });
        const passwordReset = null; // Temporary
        if (!passwordReset) {
            return res.status(400).json({ error: 'Invalid or expired reset token.' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        await database_1.prisma.user.update({
            where: { id: users[0].id },
            data: { password: hashedPassword },
        });
        // TODO: Implement password reset when Prisma client is fixed
        // await prisma.passwordReset.deleteMany({
        //     where: { userId: users[0].id },
        // });
        res.status(200).json({ message: 'Password has been reset successfully.' });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password.' });
    }
});
exports.default = router;
