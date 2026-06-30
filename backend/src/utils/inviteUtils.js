import { env } from '../config/env.js';

export function buildJoinUrl(meetingCode) {
  return `${env.clientUrl}/join/${meetingCode}`;
}

export function formatMeetingTime(scheduledAt, timezone = 'UTC') {
  const date = new Date(scheduledAt);
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone === 'UTC' ? undefined : timezone,
  });
}

export function buildInviteText({ meeting, hostName, joinUrl }) {
  const when = meeting.scheduledAt
    ? formatMeetingTime(meeting.scheduledAt, meeting.timezone)
    : 'Starts when the host begins';

  return [
    `You're invited to a UniMeet video meeting`,
    ``,
    `Topic: ${meeting.title}`,
    `Host: ${hostName}`,
    `Time: ${when}`,
    meeting.durationMinutes ? `Duration: ${meeting.durationMinutes} minutes` : null,
    meeting.description ? `\n${meeting.description}\n` : null,
    `Join link: ${joinUrl}`,
    `Meeting ID: ${meeting.meetingCode}`,
    ``,
    `Join from UniMeet: ${joinUrl}`,
  ]
    .filter(Boolean)
    .join('\n');
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function toIcsDate(iso) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

export function buildIcsCalendar({ meeting, hostName, joinUrl }) {
  const start = new Date(meeting.scheduledAt);
  const end = new Date(start.getTime() + (meeting.durationMinutes || 60) * 60000);
  const uid = `${meeting.id}@unimeet`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UniMeet//Scheduling//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(start.toISOString())}`,
    `DTEND:${toIcsDate(end.toISOString())}`,
    `SUMMARY:${meeting.title.replace(/,/g, '\\,')}`,
    `DESCRIPTION:Join UniMeet meeting\\nLink: ${joinUrl}\\nMeeting ID: ${meeting.meetingCode}`,
    `LOCATION:${joinUrl}`,
    `ORGANIZER;CN=${hostName}:mailto:noreply@unimeet.app`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
