import { customAlphabet } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';
import { getSupabase, throwIfError } from '../config/supabase.js';
import {
  mapMeeting,
  mapParticipation,
  mapChatMessage,
  mapUserPublic,
  mapInvite,
  meetingToDb,
} from '../utils/dbMappers.js';
import { buildJoinUrl, buildInviteText, buildIcsCalendar } from '../utils/inviteUtils.js';

const generateMeetingCode = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 10);

async function fetchHost(hostId) {
  const { data, error } = await getSupabase()
    .from('users')
    .select('id, display_name, email')
    .eq('id', hostId)
    .maybeSingle();
  throwIfError(error, 'Failed to fetch host');
  return mapUserPublic(data);
}

export async function createMeeting({ hostId, title, waitingRoom = false }) {
  let meetingCode;
  let exists = true;

  while (exists) {
    meetingCode = generateMeetingCode();
    const { data } = await getSupabase()
      .from('meetings')
      .select('id')
      .eq('meeting_code', meetingCode)
      .maybeSingle();
    exists = !!data;
  }

  const { data: row, error } = await getSupabase()
    .from('meetings')
    .insert({
      id: uuidv4(),
      ...meetingToDb({
        meetingCode,
        title: title || 'Untitled Meeting',
        hostId,
        waitingRoom,
        isActive: false,
      }),
    })
    .select()
    .single();

  throwIfError(error, 'Failed to create meeting');
  const host = await fetchHost(hostId);
  return mapMeeting(row, host);
}

export async function getMeetingByCode(meetingCode) {
  const { data: row, error } = await getSupabase()
    .from('meetings')
    .select('*')
    .eq('meeting_code', meetingCode)
    .maybeSingle();

  throwIfError(error, 'Failed to fetch meeting');
  if (!row) return null;
  const host = await fetchHost(row.host_id);
  return mapMeeting(row, host);
}

export async function getMeetingById(id) {
  const { data: row, error } = await getSupabase()
    .from('meetings')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  throwIfError(error, 'Failed to fetch meeting');
  if (!row) return null;
  const host = await fetchHost(row.host_id);
  return mapMeeting(row, host);
}

export async function endMeeting(meetingId, hostId) {
  const meeting = await getMeetingById(meetingId);
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

  const { data: row, error } = await getSupabase()
    .from('meetings')
    .update(meetingToDb({ isActive: false, endedAt: new Date().toISOString() }))
    .eq('id', meetingId)
    .select()
    .single();

  throwIfError(error, 'Failed to end meeting');
  return mapMeeting(row, meeting.host);
}

export async function startMeetingByCode(meetingCode, hostId) {
  const meeting = await getMeetingByCode(meetingCode);
  if (!meeting) {
    const err = new Error('Meeting not found');
    err.status = 404;
    throw err;
  }
  if (meeting.hostId !== hostId) {
    const err = new Error('Only the host can start the meeting');
    err.status = 403;
    throw err;
  }
  if (meeting.endedAt) {
    const err = new Error('This meeting has already ended');
    err.status = 400;
    throw err;
  }
  if (meeting.isActive) {
    return meeting;
  }

  const now = new Date().toISOString();
  const { data: row, error } = await getSupabase()
    .from('meetings')
    .update(meetingToDb({ isActive: true, startedAt: now }))
    .eq('id', meeting.id)
    .select()
    .single();

  throwIfError(error, 'Failed to start meeting');
  const host = await fetchHost(hostId);
  return mapMeeting(row, host);
}

export async function logParticipationJoin({ meetingId, userId, role = 'participant' }) {
  const { data: row, error } = await getSupabase()
    .from('meeting_participations')
    .insert({ id: uuidv4(), meeting_id: meetingId, user_id: userId, role })
    .select()
    .single();

  throwIfError(error, 'Failed to log participation');
  return mapParticipation(row);
}

export async function logParticipationLeave(participationId) {
  const { data: row, error } = await getSupabase()
    .from('meeting_participations')
    .update({ left_at: new Date().toISOString() })
    .eq('id', participationId)
    .select()
    .single();

  throwIfError(error, 'Failed to log leave');
  return mapParticipation(row);
}

export async function getUserMeetingHistory(userId) {
  const { data: hostedRows, error: hostedError } = await getSupabase()
    .from('meetings')
    .select('*')
    .eq('host_id', userId)
    .order('started_at', { ascending: false });

  throwIfError(hostedError, 'Failed to fetch hosted meetings');

  const hosted = await Promise.all(
    (hostedRows || []).map(async (row) => {
      const { data: parts } = await getSupabase()
        .from('meeting_participations')
        .select('*')
        .eq('meeting_id', row.id);

      const participations = await Promise.all(
        (parts || []).map(async (p) => {
          const { data: u } = await getSupabase()
            .from('users')
            .select('id, display_name, email')
            .eq('id', p.user_id)
            .single();
          return mapParticipation(p, u);
        })
      );

      return { ...mapMeeting(row), participations };
    })
  );

  const { data: joinedRows, error: joinedError } = await getSupabase()
    .from('meeting_participations')
    .select('*')
    .eq('user_id', userId)
    .eq('role', 'participant')
    .order('joined_at', { ascending: false });

  throwIfError(joinedError, 'Failed to fetch joined meetings');

  const joined = await Promise.all(
    (joinedRows || []).map(async (p) => {
      const { data: meetingRow } = await getSupabase()
        .from('meetings')
        .select('*')
        .eq('id', p.meeting_id)
        .single();

      const host = meetingRow ? await fetchHost(meetingRow.host_id) : null;
      const meeting = mapMeeting(meetingRow, host);

      const { data: parts } = await getSupabase()
        .from('meeting_participations')
        .select('*')
        .eq('meeting_id', p.meeting_id);

      const participations = await Promise.all(
        (parts || []).map(async (part) => {
          const { data: u } = await getSupabase()
            .from('users')
            .select('id, display_name, email')
            .eq('id', part.user_id)
            .single();
          return mapParticipation(part, u);
        })
      );

      return { ...mapParticipation(p), meeting: { ...meeting, participations } };
    })
  );

  return { hosted, joined };
}

export async function saveChatMessage({ meetingId, senderId, senderName, content }) {
  const { data: row, error } = await getSupabase()
    .from('chat_messages')
    .insert({
      id: uuidv4(),
      meeting_id: meetingId,
      sender_id: senderId,
      sender_name: senderName,
      content,
    })
    .select()
    .single();

  throwIfError(error, 'Failed to save chat message');
  return mapChatMessage(row);
}

export async function getChatHistory(meetingId, limit = 100) {
  const { data: rows, error } = await getSupabase()
    .from('chat_messages')
    .select('*')
    .eq('meeting_id', meetingId)
    .order('created_at', { ascending: true })
    .limit(limit);

  throwIfError(error, 'Failed to fetch chat history');
  return (rows || []).map(mapChatMessage);
}

async function generateUniqueMeetingCode() {
  let meetingCode;
  let exists = true;
  while (exists) {
    meetingCode = generateMeetingCode();
    const { data } = await getSupabase()
      .from('meetings')
      .select('id')
      .eq('meeting_code', meetingCode)
      .maybeSingle();
    exists = !!data;
  }
  return meetingCode;
}

async function saveInvites(meetingId, emails = []) {
  const unique = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  if (unique.length === 0) return [];

  const rows = unique.map((email) => ({
    id: uuidv4(),
    meeting_id: meetingId,
    email,
  }));

  const { data, error } = await getSupabase().from('meeting_invites').insert(rows).select();
  throwIfError(error, 'Failed to save invites');
  return (data || []).map(mapInvite);
}

async function fetchInvites(meetingId) {
  const { data, error } = await getSupabase()
    .from('meeting_invites')
    .select('*')
    .eq('meeting_id', meetingId)
    .order('invited_at', { ascending: true });
  throwIfError(error, 'Failed to fetch invites');
  return (data || []).map(mapInvite);
}

export async function scheduleMeeting({
  hostId,
  title,
  scheduledAt,
  durationMinutes = 60,
  waitingRoom = false,
  description = '',
  timezone = 'UTC',
  inviteEmails = [],
}) {
  if (!scheduledAt) {
    const err = new Error('scheduledAt is required');
    err.status = 400;
    throw err;
  }

  const scheduledDate = new Date(scheduledAt);
  if (Number.isNaN(scheduledDate.getTime())) {
    const err = new Error('Invalid scheduledAt date');
    err.status = 400;
    throw err;
  }

  if (scheduledDate <= new Date()) {
    const err = new Error('Scheduled time must be in the future');
    err.status = 400;
    throw err;
  }

  const meetingCode = await generateUniqueMeetingCode();
  const meetingId = uuidv4();

  const { data: row, error } = await getSupabase()
    .from('meetings')
    .insert({
      id: meetingId,
      ...meetingToDb({
        meetingCode,
        title: title || 'Scheduled Meeting',
        hostId,
        waitingRoom,
        isActive: false,
        scheduledAt: scheduledDate.toISOString(),
        durationMinutes,
        description: description || null,
        timezone,
      }),
    })
    .select()
    .single();

  throwIfError(error, 'Failed to schedule meeting');

  const host = await fetchHost(hostId);
  const meeting = mapMeeting(row, host);
  const invites = await saveInvites(meetingId, inviteEmails);
  const joinUrl = buildJoinUrl(meeting.meetingCode);
  const inviteText = buildInviteText({
    meeting,
    hostName: host.displayName,
    joinUrl,
  });

  return {
    meeting: { ...meeting, invites },
    joinUrl,
    inviteText,
  };
}

export async function getScheduledMeetings(hostId, { days = 30 } = {}) {
  const now = new Date();
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const { data: rows, error } = await getSupabase()
    .from('meetings')
    .select('*')
    .eq('host_id', hostId)
    .not('scheduled_at', 'is', null)
    .eq('is_active', true)
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', until.toISOString())
    .order('scheduled_at', { ascending: true });

  throwIfError(error, 'Failed to fetch scheduled meetings');

  return Promise.all(
    (rows || []).map(async (row) => {
      const host = await fetchHost(row.host_id);
      const invites = await fetchInvites(row.id);
      const meeting = mapMeeting(row, host);
      return {
        ...meeting,
        invites,
        joinUrl: buildJoinUrl(meeting.meetingCode),
      };
    })
  );
}

export async function getMeetingInviteDetails(meetingId, userId) {
  const meeting = await getMeetingById(meetingId);
  if (!meeting) {
    const err = new Error('Meeting not found');
    err.status = 404;
    throw err;
  }
  if (meeting.hostId !== userId) {
    const err = new Error('Only the host can access invite details');
    err.status = 403;
    throw err;
  }

  const invites = await fetchInvites(meetingId);
  const joinUrl = buildJoinUrl(meeting.meetingCode);
  const host = meeting.host;
  const inviteText = buildInviteText({
    meeting,
    hostName: host?.displayName || 'Host',
    joinUrl,
  });
  const ics = buildIcsCalendar({
    meeting,
    hostName: host?.displayName || 'Host',
    joinUrl,
  });

  return { meeting: { ...meeting, invites }, joinUrl, inviteText, ics };
}

export async function cancelScheduledMeeting(meetingId, hostId) {
  const meeting = await getMeetingById(meetingId);
  if (!meeting) {
    const err = new Error('Meeting not found');
    err.status = 404;
    throw err;
  }
  if (meeting.hostId !== hostId) {
    const err = new Error('Only the host can cancel this meeting');
    err.status = 403;
    throw err;
  }
  if (!meeting.scheduledAt) {
    const err = new Error('This is not a scheduled meeting');
    err.status = 400;
    throw err;
  }

  const { data: row, error } = await getSupabase()
    .from('meetings')
    .update(meetingToDb({ isActive: false, endedAt: new Date().toISOString() }))
    .eq('id', meetingId)
    .select()
    .single();

  throwIfError(error, 'Failed to cancel meeting');
  return mapMeeting(row, meeting.host);
}
