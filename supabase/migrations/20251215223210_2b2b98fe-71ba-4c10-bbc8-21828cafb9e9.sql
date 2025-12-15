-- Force RLS on all tables to prevent accidental data exposure
-- This ensures RLS policies are enforced even for table owners

ALTER TABLE public.business_transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cars FORCE ROW LEVEL SECURITY;
ALTER TABLE public.categories FORCE ROW LEVEL SECURITY;
ALTER TABLE public.jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.notes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.shifts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.tasks FORCE ROW LEVEL SECURITY;
ALTER TABLE public.workout_days FORCE ROW LEVEL SECURITY;
ALTER TABLE public.workout_weeks FORCE ROW LEVEL SECURITY;