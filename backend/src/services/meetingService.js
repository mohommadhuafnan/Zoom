import { customAlphabet } from 'nanoid';
import prisma from '../config/db.js';

const generateMeetingCode = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 10);

export async function createMeeting({ hostId, title, waitingRoom = false }) {
  let meetingCode;
  let exists = true;

  while (exists) {
    meetingCode = generateMeetingCode();
    const found = await prisma.meeting.findUnique({ where: { meetingCode } });
    exists = !!found;
  }

  const meeting = await prisma.meeting.create({
    data: {
      meetingCode,
      title: title || 'Untitled Meeting',
      hostId,
      waitingRoom,
    },
    include: { host: { select: { id: true, displayName: true, email: true } } },
  });

  return meeting;
}

export async function getMeetingByCode(meetingCode) {
  return prisma.meeting.findUnique({
    where: { meetingCode },
    include: { host: { select: { id: true, displayName: true, email: true } } },
  });
}

export async function getMeetingById(id) {
  return prisma.meeting.findUnique({
    where: { id },
    include: { host: { select: { id: true, displayName: true, email: true } } },
  });
}

export async function endMeeting(meetingId, hostId) {
  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) {
    const err = new Error('Meeting not found');
    err.status = 404;
    throw err;
  }
  if (meeting.hostId !== hostId) {
    const err = new Error('Only the host can end the meeting');
    err.status = 403;
    throw err;
  }

  return prisma.meeting.update({
    where: { id: meetingId },
    data: { isActive: false, endedAt: new Date() },
  });
}

export async function logParticipationJoin({ meetingId, userId, role = 'participant' }) {
  return prisma.meetingParticipation.create({
    data: { meetingId, userId, role },
  });
}

export async function logParticipationLeave(participationId) {
  return prisma.meetingParticipation.update({
    where: { id: participationId },
    data: { leftAt: new Date() },
  });
}

export async function getUserMeetingHistory(userId) {
  const hosted = await prisma.meeting.findMany({
    where: { hostId: userId },
    orderBy: { startedAt: 'desc' },
    include: {
      participations: {
        include: { user: { select: { id: true, displayName: true, email: true } } },
      },
    },
  });

  const joined = await prisma.meetingParticipation.findMany({
    where: { userId, role: 'participant' },
    orderBy: { joinedAt: 'desc' },
    include: {
      meeting: {
        include: {
          host: { select: { id: true, displayName: true, email: true } },
          participations: {
            include: { user: { select: { id: true, displayName: true, email: true } } },
          },
        },
      },
    },
  });

  return { hosted, joined };
}

export async function saveChatMessage({ meetingId, senderId, senderName, content }) {
  return prisma.chatMessage.create({
    data: { meetingId, senderId, senderName, content },
  });
}

export async function getChatHistory(meetingId, limit = 100) {
  return prisma.chatMessage.findMany({
    where: { meetingId },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
}
