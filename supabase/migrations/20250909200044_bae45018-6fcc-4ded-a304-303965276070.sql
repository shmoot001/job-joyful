-- Add break_time column to jobs table (in minutes)
ALTER TABLE public.jobs 
ADD COLUMN break_time integer DEFAULT 0 NOT NULL;