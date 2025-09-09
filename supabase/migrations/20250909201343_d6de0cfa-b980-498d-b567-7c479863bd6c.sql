-- Add OB (overtime bonus) column to jobs table (in SEK per hour)
ALTER TABLE public.jobs 
ADD COLUMN ob_rate numeric DEFAULT 0 NOT NULL;