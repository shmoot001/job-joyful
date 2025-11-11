-- Create cars table
CREATE TABLE public.cars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  car_number TEXT NOT NULL,
  model TEXT NOT NULL,
  inspection_date DATE,
  tax_month TEXT,
  tax_price NUMERIC DEFAULT 0,
  insurance_price NUMERIC DEFAULT 0,
  insurance_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can manage their own cars"
ON public.cars
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cars_updated_at
BEFORE UPDATE ON public.cars
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();