-- Add finance digest notification type
ALTER TYPE "public"."notification_type" ADD VALUE IF NOT EXISTS 'finance_digest';
