-- Enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily summary email (every day at 7:00 AM)
SELECT cron.schedule(
  'daily-summary-email',
  '0 7 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://sypmwbybrcuxmnouzjwu.supabase.co/functions/v1/send-summary-email',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5cG13YnlicmN1eG1ub3V6and1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MjA0MDksImV4cCI6MjA3MTI5NjQwOX0.vmnpkuQw7KwaTQELlxb8Di7YPj0ulSBYs5Rhy09VcX0"}'::jsonb,
        body:='{"type": "daily"}'::jsonb
    ) as request_id;
  $$
);

-- Schedule weekly summary email (every Sunday at 8:00 AM)
SELECT cron.schedule(
  'weekly-summary-email',
  '0 8 * * 0',
  $$
  SELECT
    net.http_post(
        url:='https://sypmwbybrcuxmnouzjwu.supabase.co/functions/v1/send-summary-email',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5cG13YnlicmN1eG1ub3V6and1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MjA0MDksImV4cCI6MjA3MTI5NjQwOX0.vmnpkuQw7KwaTQELlxb8Di7YPj0ulSBYs5Rhy09VcX0"}'::jsonb,
        body:='{"type": "weekly"}'::jsonb
    ) as request_id;
  $$
);