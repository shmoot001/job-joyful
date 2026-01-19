-- Add is_done column to project_meetings
ALTER TABLE public.project_meetings 
ADD COLUMN is_done BOOLEAN NOT NULL DEFAULT false;

-- Add folder column to project_attachments for organizing files
ALTER TABLE public.project_attachments 
ADD COLUMN folder TEXT;