-- Run this in Supabase Dashboard → SQL Editor → New query → Run
-- Creates all UniMeet tables on your Supabase PostgreSQL database

CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meetings" (
    "id" TEXT NOT NULL,
    "meeting_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "waiting_room" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meeting_participations" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "role" TEXT NOT NULL DEFAULT 'participant',
    CONSTRAINT "meeting_participations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "chat_messages" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "sender_name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "meetings_meeting_code_key" ON "meetings"("meeting_code");

ALTER TABLE "meetings" DROP CONSTRAINT IF EXISTS "meetings_host_id_fkey";
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_host_id_fkey"
  FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "meeting_participations" DROP CONSTRAINT IF EXISTS "meeting_participations_meeting_id_fkey";
ALTER TABLE "meeting_participations" ADD CONSTRAINT "meeting_participations_meeting_id_fkey"
  FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meeting_participations" DROP CONSTRAINT IF EXISTS "meeting_participations_user_id_fkey";
ALTER TABLE "meeting_participations" ADD CONSTRAINT "meeting_participations_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "chat_messages" DROP CONSTRAINT IF EXISTS "chat_messages_meeting_id_fkey";
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_meeting_id_fkey"
  FOREIGN KEY ("meeting_id") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Prisma migration tracking (optional — lets `prisma migrate deploy` know init ran)
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) NOT NULL PRIMARY KEY,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);
