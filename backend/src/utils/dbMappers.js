export function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapUserPublic(row) {
  if (!row) return null;
  return {
    id: row.id,
    displayName: row.display_name,
    email: row.email,
  };
}

export function mapMeeting(row, host = null) {
  if (!row) return null;
  return {
    id: row.id,
    meetingCode: row.meeting_code,
    title: row.title,
    hostId: row.host_id,
    waitingRoom: row.waiting_room,
    isActive: row.is_active,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes ?? 60,
    description: row.description,
    timezone: row.timezone ?? 'UTC',
    startedAt: row.started_at,
    endedAt: row.ended_at,
    createdAt: row.created_at,
    isScheduled: !!row.scheduled_at,
    ...(host && { host: mapUserPublic(host) }),
  };
}

export function mapParticipation(row, user = null) {
  if (!row) return null;
  return {
    id: row.id,
    meetingId: row.meeting_id,
    userId: row.user_id,
    joinedAt: row.joined_at,
    leftAt: row.left_at,
    role: row.role,
    ...(user && { user: mapUserPublic(user) }),
  };
}

export function mapChatMessage(row) {
  if (!row) return null;
  return {
    id: row.id,
    meetingId: row.meeting_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    content: row.content,
    createdAt: row.created_at,
  };
}

export function userToDb({ email, passwordHash, displayName, avatarUrl }) {
  return {
    ...(email !== undefined && { email }),
    ...(passwordHash !== undefined && { password_hash: passwordHash }),
    ...(displayName !== undefined && { display_name: displayName }),
    ...(avatarUrl !== undefined && { avatar_url: avatarUrl }),
  };
}

export function meetingToDb({
  meetingCode,
  title,
  hostId,
  waitingRoom,
  isActive,
  endedAt,
  scheduledAt,
  durationMinutes,
  description,
  timezone,
  startedAt,
}) {
  return {
    ...(meetingCode !== undefined && { meeting_code: meetingCode }),
    ...(title !== undefined && { title }),
    ...(hostId !== undefined && { host_id: hostId }),
    ...(waitingRoom !== undefined && { waiting_room: waitingRoom }),
    ...(isActive !== undefined && { is_active: isActive }),
    ...(endedAt !== undefined && { ended_at: endedAt }),
    ...(scheduledAt !== undefined && { scheduled_at: scheduledAt }),
    ...(durationMinutes !== undefined && { duration_minutes: durationMinutes }),
    ...(description !== undefined && { description }),
    ...(timezone !== undefined && { timezone }),
    ...(startedAt !== undefined && { started_at: startedAt }),
  };
}

export function mapInvite(row) {
  if (!row) return null;
  return {
    id: row.id,
    meetingId: row.meeting_id,
    email: row.email,
    invitedAt: row.invited_at,
  };
}
