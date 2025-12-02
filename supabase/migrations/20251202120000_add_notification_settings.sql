-- Add notification_settings column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{}'::jsonb;

-- Add is_email_notified column to client_alerts table
ALTER TABLE public.client_alerts 
ADD COLUMN IF NOT EXISTS is_email_notified BOOLEAN DEFAULT FALSE;

-- Index for performance on querying pending notifications
CREATE INDEX IF NOT EXISTS idx_client_alerts_notification 
ON public.client_alerts (alert_date, is_dismissed, is_email_notified);
