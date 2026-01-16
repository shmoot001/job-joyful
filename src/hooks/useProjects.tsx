import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category_id?: string;
  status: string;
  priority: string;
  start_date?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectTask {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  position: number;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectNote {
  id: string;
  user_id: string;
  project_id: string;
  title?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectAttachment {
  id: string;
  user_id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type?: string;
  created_at: string;
}

export const useProjects = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user?.id,
  });

  // Fetch project categories
  const { data: projectCategories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["project_categories", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("project_categories")
        .select("*")
        .eq("user_id", user.id)
        .order("name");
      if (error) throw error;
      return data as ProjectCategory[];
    },
    enabled: !!user?.id,
  });

  // Create project
  const createProjectMutation = useMutation({
    mutationFn: async (project: Omit<Project, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("projects")
        .insert([{ ...project, user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", user?.id] });
      toast({ title: "Projekt skapat", description: "Ditt nya projekt har skapats" });
    },
    onError: (error) => {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    },
  });

  // Update project
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", user?.id] });
      toast({ title: "Projekt uppdaterat", description: "Ändringarna har sparats" });
    },
    onError: (error) => {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    },
  });

  // Delete project
  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", user?.id] });
      toast({ title: "Projekt borttaget", description: "Projektet har tagits bort" });
    },
    onError: (error) => {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    },
  });

  // Create category
  const createCategoryMutation = useMutation({
    mutationFn: async (category: { name: string; color?: string }) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("project_categories")
        .insert([{ ...category, user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_categories", user?.id] });
      toast({ title: "Kategori skapad" });
    },
    onError: (error) => {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    },
  });

  // Delete category
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_categories", user?.id] });
      toast({ title: "Kategori borttagen" });
    },
    onError: (error) => {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    },
  });

  return {
    projects,
    projectCategories,
    isLoadingProjects,
    isLoadingCategories,
    createProject: createProjectMutation.mutate,
    updateProject: updateProjectMutation.mutate,
    deleteProject: deleteProjectMutation.mutate,
    createCategory: createCategoryMutation.mutate,
    deleteCategory: deleteCategoryMutation.mutate,
    isCreating: createProjectMutation.isPending,
    isUpdating: updateProjectMutation.isPending,
    isDeleting: deleteProjectMutation.isPending,
  };
};

// Hook for project details (tasks, notes, attachments)
export const useProjectDetails = (projectId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch project tasks
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["project_tasks", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("position");
      if (error) throw error;
      return data as ProjectTask[];
    },
    enabled: !!projectId,
  });

  // Fetch project notes
  const { data: notes, isLoading: isLoadingNotes } = useQuery({
    queryKey: ["project_notes", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_notes")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProjectNote[];
    },
    enabled: !!projectId,
  });

  // Fetch project attachments
  const { data: attachments, isLoading: isLoadingAttachments } = useQuery({
    queryKey: ["project_attachments", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_attachments")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProjectAttachment[];
    },
    enabled: !!projectId,
  });

  // Create task
  const createTaskMutation = useMutation({
    mutationFn: async (task: Omit<ProjectTask, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("project_tasks")
        .insert([{ ...task, user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_tasks", projectId] });
    },
    onError: (error) => {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    },
  });

  // Update task
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectTask> & { id: string }) => {
      const { data, error } = await supabase
        .from("project_tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_tasks", projectId] });
    },
    onError: (error) => {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    },
  });

  // Delete task
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_tasks", projectId] });
    },
    onError: (error) => {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    },
  });

  // Create note
  const createNoteMutation = useMutation({
    mutationFn: async (note: { project_id: string; title?: string; content: string }) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("project_notes")
        .insert([{ ...note, user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_notes", projectId] });
      toast({ title: "Anteckning sparad" });
    },
    onError: (error) => {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    },
  });

  // Update note
  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectNote> & { id: string }) => {
      const { data, error } = await supabase
        .from("project_notes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_notes", projectId] });
    },
    onError: (error) => {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    },
  });

  // Delete note
  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_notes", projectId] });
    },
    onError: (error) => {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    },
  });

  // Upload attachment
  const uploadAttachmentMutation = useMutation({
    mutationFn: async ({ file, project_id }: { file: File; project_id: string }) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const filePath = `${user.id}/${project_id}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("project-attachments")
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data, error } = await supabase
        .from("project_attachments")
        .insert([{
          user_id: user.id,
          project_id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_attachments", projectId] });
      toast({ title: "Fil uppladdad" });
    },
    onError: (error) => {
      toast({ title: "Fel vid uppladdning", description: error.message, variant: "destructive" });
    },
  });

  // Delete attachment
  const deleteAttachmentMutation = useMutation({
    mutationFn: async ({ id, file_path }: { id: string; file_path: string }) => {
      const { error: storageError } = await supabase.storage
        .from("project-attachments")
        .remove([file_path]);
      
      if (storageError) throw storageError;
      
      const { error } = await supabase.from("project_attachments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_attachments", projectId] });
      toast({ title: "Fil borttagen" });
    },
    onError: (error) => {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    },
  });

  // Get download URL for attachment
  const getAttachmentUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from("project-attachments")
      .createSignedUrl(filePath, 3600);
    return data?.signedUrl;
  };

  return {
    tasks,
    notes,
    attachments,
    isLoadingTasks,
    isLoadingNotes,
    isLoadingAttachments,
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    createNote: createNoteMutation.mutate,
    updateNote: updateNoteMutation.mutate,
    deleteNote: deleteNoteMutation.mutate,
    uploadAttachment: uploadAttachmentMutation.mutate,
    deleteAttachment: deleteAttachmentMutation.mutate,
    getAttachmentUrl,
    isUploadingAttachment: uploadAttachmentMutation.isPending,
  };
};
