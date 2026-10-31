-- Saved workout programs (a reusable week template)
CREATE TABLE public.workout_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  -- [{ day_of_week, body_part, exercises, notes, is_rest_day }]
  days JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_programs FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own workout programs"
ON public.workout_programs FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_workout_programs_updated_at
BEFORE UPDATE ON public.workout_programs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_workout_programs_user_id ON public.workout_programs(user_id);

-- Body measurements (bodyweight + optional progress photo)
CREATE TABLE public.body_measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  weight NUMERIC(5,1),
  photo_path TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements FORCE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own body measurements"
ON public.body_measurements FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_body_measurements_user_date ON public.body_measurements(user_id, date);

-- Private bucket for progress photos, one folder per user
INSERT INTO storage.buckets (id, name, public)
VALUES ('body-photos', 'body-photos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can view their own body photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'body-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own body photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'body-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own body photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'body-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own body photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'body-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
