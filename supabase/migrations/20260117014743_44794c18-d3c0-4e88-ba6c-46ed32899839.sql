-- Create project task attachments table
CREATE TABLE public.project_task_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_task_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Users can manage their own task attachments"
ON public.project_task_attachments FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Storage policies for task attachments (same bucket, different folder structure)
CREATE POLICY "Users can view their own task attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own task attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'project-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);