import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createMeeting,
  getMeetingByCode,
  endMeeting,
  endMeetingByCode,
  startMeetingByCode,
  getUserMeetingHistory,
  scheduleMeeting,
  getScheduledMeetings,
  getMeetingInviteDetails,
  cancelScheduledMeeting,
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

router.post('/schedule', authMiddleware, async (req, res) => {
  try {
    const {
      title,
      scheduledAt,
      durationMinutes,
      waitingRoom,
      description,
      timezone,
      inviteEmails,
    } = req.body;

    const result = await scheduleMeeting({
      hostId: req.user.userId,
      title,
      scheduledAt,
      durationMinutes,
      waitingRoom: !!waitingRoom,
      description,
      timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      inviteEmails: Array.isArray(inviteEmails) ? inviteEmails : [],
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/scheduled', authMiddleware, async (req, res) => {
  try {
    const meetings = await getScheduledMeetings(req.user.userId, {
      days: parseInt(req.query.days || '30', 10),
    });
    res.json({ meetings });
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

router.get('/:id/invite', authMiddleware, async (req, res) => {
  try {
    const details = await getMeetingInviteDetails(req.params.id, req.user.userId);
    res.json(details);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/:id/invite.ics', authMiddleware, async (req, res) => {
  try {
    const { ics, meeting } = await getMeetingInviteDetails(req.params.id, req.user.userId);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="unimeet-${meeting.meetingCode}.ics"`
    );
    res.send(ics);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.delete('/scheduled/:id', authMiddleware, async (req, res) => {
  try {
    const meeting = await cancelScheduledMeeting(req.params.id, req.user.userId);
    res.json({ meeting });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/join/:code', async (req, res) => {
  try {
    const meeting = await getMeetingByCode(req.params.code);
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
      res.json({
      meeting: {
        id: meeting.id,
        meetingCode: meeting.meetingCode,
        title: meeting.title,
        isActive: meeting.isActive,
        hostStarted: meeting.isActive,
        ended: !!meeting.endedAt,
        waitingRoom: meeting.waitingRoom,
        scheduledAt: meeting.scheduledAt,
        hostId: meeting.hostId,
        hostName: meeting.host?.displayName,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:code/end', authMiddleware, async (req, res) => {
  try {
    const meeting = await endMeetingByCode(req.params.code, req.user.userId);
    res.json({ meeting });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/:code/start', authMiddleware, async (req, res) => {
  try {
    const meeting = await startMeetingByCode(req.params.code, req.user.userId);
    res.json({ meeting });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
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
