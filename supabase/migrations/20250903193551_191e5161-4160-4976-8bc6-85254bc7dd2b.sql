-- Create workout_weeks table
CREATE TABLE public.workout_weeks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start_date DATE NOT NULL,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout_days table
CREATE TABLE public.workout_days (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workout_week_id UUID NOT NULL REFERENCES public.workout_weeks(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  date DATE NOT NULL,
  body_part TEXT,
  exercises TEXT,
  notes TEXT,
  is_rest_day BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workout_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_days ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workout_weeks
CREATE POLICY "Users can manage their own workout weeks" 
ON public.workout_weeks 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for workout_days
CREATE POLICY "Users can manage their own workout days" 
ON public.workout_days 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_workout_weeks_updated_at
BEFORE UPDATE ON public.workout_weeks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workout_days_updated_at
BEFORE UPDATE ON public.workout_days
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_workout_weeks_user_id ON public.workout_weeks(user_id);
CREATE INDEX idx_workout_weeks_week_start ON public.workout_weeks(week_start_date);
CREATE INDEX idx_workout_days_user_id ON public.workout_days(user_id);
CREATE INDEX idx_workout_days_workout_week_id ON public.workout_days(workout_week_id);
CREATE INDEX idx_workout_days_date ON public.workout_days(date);