import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createMeeting,
  getMeetingByCode,
  endMeeting,
  getUserMeetingHistory,
} from '../services/meetingService.js';
import { env } from '../config/env.js';

const router = Router();

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, waitingRoom } = req.body;
    const meeting = await createMeeting({
      hostId: req.user.userId,
      title,
      waitingRoom: !!waitingRoom,
    });
    res.status(201).json({
      meeting,
      joinUrl: `${env.clientUrl}/join/${meeting.meetingCode}`,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const history = await getUserMeetingHistory(req.user.userId);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:code', authMiddleware, async (req, res) => {
  try {
    const meeting = await getMeetingByCode(req.params.code);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    res.json({ meeting });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/end', authMiddleware, async (req, res) => {
  try {
    const meeting = await endMeeting(req.params.id, req.user.userId);
    res.json({ meeting });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
