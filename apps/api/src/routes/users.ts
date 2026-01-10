// Users management routes
import { Router } from 'express';
import jwt from 'jsonwebtoken';

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

export default router;
