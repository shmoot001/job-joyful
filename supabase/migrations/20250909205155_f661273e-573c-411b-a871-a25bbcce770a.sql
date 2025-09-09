-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Users can manage their own categories" 
ON public.categories 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories for existing users
INSERT INTO public.categories (user_id, name, color)
SELECT DISTINCT user_id, 'Privat', '#3B82F6' FROM public.tasks
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO public.categories (user_id, name, color) 
SELECT DISTINCT user_id, 'Arbete', '#10B981' FROM public.tasks
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO public.categories (user_id, name, color)
SELECT DISTINCT user_id, 'Skola', '#F59E0B' FROM public.tasks
ON CONFLICT (user_id, name) DO NOTHING;

-- Create categories from existing task categories
INSERT INTO public.categories (user_id, name, color)
SELECT DISTINCT user_id, category, '#6366F1'
FROM public.tasks 
WHERE category IS NOT NULL 
  AND category NOT IN ('Privat', 'Arbete', 'Skola')
ON CONFLICT (user_id, name) DO NOTHING;