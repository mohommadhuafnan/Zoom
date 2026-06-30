-- Run in Supabase SQL Editor (after supabase-init.sql)
-- Adds scheduling columns + participant invites

ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "scheduled_at" TIMESTAMP(3);
ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "duration_minutes" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'UTC';

-- Allow scheduled meetings to exist before they start
ALTER TABLE "meetings" ALTER COLUMN "started_at" DROP NOT NULL;
ALTER TABLE "meetings" ALTER COLUMN "started_at" DROP DEFAULT;

CREATE TABLE IF NOT EXISTS "meeting_invites" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meeting_invites_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "meetings_scheduled_at_idx" ON "meetings"("scheduled_at");
CREATE INDEX IF NOT EXISTS "meetings_host_scheduled_idx" ON "meetings"("host_id", "scheduled_at");
CREATE UNIQUE INDEX IF NOT EXISTS "meeting_invites_meeting_email_key" ON "meeting_invites"("meeting_id", "email");

ALTER TABLE "meeting_invites" DROP CONSTRAINT IF EXISTS "meeting_invites_meeting_id_fkey";
ALTER TABLE "meeting_invites" ADD CONSTRAINT "meeting_invites_meeting_id_fkey"
  FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
