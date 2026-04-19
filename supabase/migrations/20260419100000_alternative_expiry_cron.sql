-- Enable pg_cron extension (Supabase has it available)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Cron job: expire unread alternative_proposed notifications after 24h
-- Runs every hour, marks stale proposals as read
SELECT cron.schedule(
  'expire-alternative-proposals',
  '0 * * * *',  -- every hour
  $$
    -- Mark stale alternative_proposed notifications as read
    UPDATE notifications
    SET is_read = true, updated_at = now()
    WHERE type = 'alternative_proposed'
      AND is_read = false
      AND created_at < now() - interval '24 hours';
  $$
);
