import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
} from '../services/authService.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password || !displayName) {
      return res.status(400).json({ error: 'email, password, and displayName are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const result = await registerUser({ email, password, displayName });
    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const result = await loginUser({ email, password });
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await getUserById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/me', authMiddleware, async (req, res) => {
  try {
    const { displayName, avatarUrl } = req.body;
    const user = await updateUserProfile(req.user.userId, { displayName, avatarUrl });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
