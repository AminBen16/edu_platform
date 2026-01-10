// Users management routes
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { protect, authorize } from '../middleware/auth';
import { RequestWithUser } from '../types/auth';
import { logAudit } from '../middleware/auditLog';
import EmailService from '../services/emailService';

const router = Router();

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// GET /users/profile - Get current user profile
router.get('/profile', authenticateToken, async (req: any, res: any) => {
  try {
    // In production, fetch from database
    // For now, return mock user data
    const userProfile = {
      id: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      schoolId: req.user.schoolId,
      name: req.user.email?.split('@')[0] || 'User',
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    };

    res.json(userProfile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /users/profile - Update user profile
router.put('/profile', authenticateToken, async (req: any, res: any) => {
  try {
    const { name, avatarUrl } = req.body;
    
    // In production, update in database
    // For now, return success
    res.json({
      message: 'Profile updated successfully',
      user: {
        ...req.user,
        name: name || req.user.name,
        avatarUrl: avatarUrl || req.user.avatarUrl,
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /users/request-deletion - Request account deletion
router.post('/request-deletion', authenticateToken, async (req: any, res: any) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }

  try {
    // Get user with password and school info
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, password: true, name: true, schoolId: true }
    });

    if (!user || !user.password) {
      return res.status(400).json({ error: 'User not found or invalid account' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    // Check if deletion request already exists
    const existingRequest = await prisma.deletionRequest.findUnique({
      where: { userId: user.id }
    });

    if (existingRequest && existingRequest.expiresAt > new Date()) {
      return res.status(400).json({ error: 'Deletion request already exists' });
    }

    // Generate deletion token
    const deletionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const deletionRequest = await prisma.deletionRequest.upsert({
      where: { userId: user.id },
      update: {
        token: deletionToken,
        expiresAt,
        requestedAt: new Date(),
        confirmedAt: null,
        completedAt: null
      },
      create: {
        userId: user.id,
        token: deletionToken,
        expiresAt,
        requestedAt: new Date()
      }
    });

    // Log deletion request
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETION_REQUESTED',
        resource: user.id,
        details: { requestId: deletionRequest.id },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    // Send deletion confirmation email
    const school = await prisma.school.findUnique({
      where: { id: user.schoolId },
      select: { name: true }
    });

    if (school) {
      const emailSent = await EmailService.sendDeletionConfirmationEmail(
        user.email,
        user.name,
        deletionToken,
        school.name
      );
      
      if (!emailSent) {
        console.warn('Failed to send deletion confirmation email, but deletion request was created');
      }
    }

    res.json({ 
      message: 'Deletion confirmation sent to your email',
      requestId: deletionRequest.id
    });

  } catch (error) {
    console.error('Deletion request error:', error);
    res.status(500).json({ error: 'Failed to request deletion' });
  }
});

// DELETE /users/confirm-deletion/:token - Confirm account deletion
router.delete('/confirm-deletion/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const deletionRequest = await prisma.deletionRequest.findUnique({
      where: { 
        token,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: {
          select: { id: true, email: true, name: true }
        }
      }
    });

    if (!deletionRequest) {
      return res.status(400).json({ error: 'Invalid or expired deletion token' });
    }

    // Soft delete the user (grace period)
    await prisma.user.update({
      where: { id: deletionRequest.userId },
      data: { 
        isActive: false,
        deletedAt: new Date(),
        deletionRequestedAt: new Date()
      }
    });

    // Update deletion request
    await prisma.deletionRequest.update({
      where: { id: deletionRequest.id },
      data: { 
        confirmedAt: new Date(),
        completedAt: new Date()
      }
    });

    // Log account deletion
    await prisma.auditLog.create({
      data: {
        userId: deletionRequest.userId,
        action: 'ACCOUNT_DELETED',
        resource: deletionRequest.userId,
        details: { requestId: deletionRequest.id },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({ 
      message: 'Account scheduled for deletion. You have 30 days to restore it.',
      gracePeriodEnds: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

  } catch (error) {
    console.error('Deletion confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm deletion' });
  }
});

// POST /users/restore-account - Restore account within grace period
router.post('/restore-account', authenticateToken, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { 
        id: req.user!.id,
        isActive: false,
        deletedAt: { not: null }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Account not eligible for restoration' });
    }

    // Check if within grace period (30 days)
    const daysSinceDeletion = (Date.now() - user.deletedAt!.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDeletion > 30) {
      return res.status(400).json({ error: 'Grace period expired. Account cannot be restored.' });
    }

    // Restore account
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        isActive: true,
        deletedAt: null,
        deletionRequestedAt: null
      }
    });

    // Update deletion request
    await prisma.deletionRequest.update({
      where: { userId: user.id },
      data: { 
        completedAt: null,
        confirmedAt: null
      }
    });

    // Log account restoration
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ACCOUNT_RESTORED',
        resource: user.id,
        details: { daysSinceDeletion },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({ message: 'Account restored successfully' });

  } catch (error) {
    console.error('Account restoration error:', error);
    res.status(500).json({ error: 'Failed to restore account' });
  }
});

// PUT /users/password - Change user password
router.put('/password', protect, async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long' });
  }

  try {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: (req as RequestWithUser).user!.id }
    });

    if (!user || !user.password) {
      return res.status(400).json({ error: 'User not found or no password set' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: (req as RequestWithUser).user!.id },
      data: { password: hashedNewPassword }
    });

    // Log password change
    await logAudit((req as RequestWithUser).user!.id, 'PASSWORD_CHANGED', 'user', {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// GET /users/deletion-status - Check deletion status
router.get('/deletion-status', authenticateToken, async (req: any, res: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        isActive: true,
        deletedAt: true,
        deletionRequestedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const deletionRequest = await prisma.deletionRequest.findUnique({
      where: { userId: req.user!.id },
      select: {
        id: true,
        requestedAt: true,
        confirmedAt: true,
        completedAt: true,
        expiresAt: true
      }
    });

    let gracePeriodEnds = null;
    if (user.deletedAt) {
      gracePeriodEnds = new Date(user.deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    res.json({
      isActive: user.isActive,
      isDeleted: !!user.deletedAt,
      deletionRequestedAt: user.deletionRequestedAt,
      deletedAt: user.deletedAt,
      gracePeriodEnds,
      canRestore: user.deletedAt && gracePeriodEnds && gracePeriodEnds > new Date(),
      deletionRequest
    });

  } catch (error) {
    console.error('Deletion status error:', error);
    res.status(500).json({ error: 'Failed to check deletion status' });
  }
});

export default router;
