import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "./use-toast";

export interface ProjectSprint {
  id: string;
  user_id: string;
  project_id: string;
  name: string;
  goal?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectEpic {
  id: string;
  user_id: string;
  project_id: string;
  name: string;
  description?: string;
  color: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMeeting {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  description?: string;
  meeting_date: string;
  start_time: string;
  end_time?: string;
  location?: string;
  meeting_link?: string;
  is_done?: boolean;
  created_at: string;
  updated_at: string;
}

export const useProjectExtras = (projectId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch sprints
  const { data: sprints, isLoading: isLoadingSprints } = useQuery({
    queryKey: ["project_sprints", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_sprints")
        .select("*")
        .eq("project_id", projectId)
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data as ProjectSprint[];
    },
    enabled: !!projectId,
  });

  // Fetch epics
  const { data: epics, isLoading: isLoadingEpics } = useQuery({
    queryKey: ["project_epics", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_epics")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProjectEpic[];
    },
    enabled: !!projectId,
  });

  // Fetch meetings
  const { data: meetings, isLoading: isLoadingMeetings } = useQuery({
    queryKey: ["project_meetings", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_meetings")
        .select("*")
        .eq("project_id", projectId)
        .order("meeting_date", { ascending: true });
      if (error) throw error;
      return data as ProjectMeeting[];
    },
    enabled: !!projectId,
  });

  // Create sprint
  const createSprintMutation = useMutation({
    mutationFn: async (sprint: Omit<ProjectSprint, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("project_sprints")
        .insert([{ ...sprint, user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_sprints", projectId] });
      toast({ title: "Sprint skapad" });
    },
    onError: (error) => {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    },
  });

  // Update sprint
  const updateSprintMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectSprint> & { id: string }) => {
      const { data, error } = await supabase
        .from("project_sprints")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_sprints", projectId] });
      toast({ title: "Sprint uppdaterad" });
    },
    onError: (error) => {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    },
  });

  // Delete sprint
  const deleteSprintMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_sprints").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_sprints", projectId] });
      toast({ title: "Sprint borttagen" });
    },
    onError: (error) => {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    },
  });

  // Create epic
  const createEpicMutation = useMutation({
    mutationFn: async (epic: Omit<ProjectEpic, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("project_epics")
        .insert([{ ...epic, user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_epics", projectId] });
      toast({ title: "Epic skapad" });
    },
    onError: (error) => {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    },
  });

  // Update epic
  const updateEpicMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectEpic> & { id: string }) => {
      const { data, error } = await supabase
        .from("project_epics")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_epics", projectId] });
      toast({ title: "Epic uppdaterad" });
    },
    onError: (error) => {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    },
  });

  // Delete epic
  const deleteEpicMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_epics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_epics", projectId] });
      toast({ title: "Epic borttagen" });
    },
    onError: (error) => {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    },
  });

  // Create meeting
  const createMeetingMutation = useMutation({
    mutationFn: async (meeting: Omit<ProjectMeeting, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("project_meetings")
        .insert([{ ...meeting, user_id: user.id }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_meetings", projectId] });
      toast({ title: "Möte skapat" });
    },
    onError: (error) => {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    },
  });

  // Update meeting
  const updateMeetingMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectMeeting> & { id: string }) => {
      const { data, error } = await supabase
        .from("project_meetings")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_meetings", projectId] });
      toast({ title: "Möte uppdaterat" });
    },
    onError: (error) => {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    },
  });

  // Delete meeting
  const deleteMeetingMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("project_meetings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project_meetings", projectId] });
      toast({ title: "Möte borttaget" });
    },
    onError: (error) => {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    },
  });

  return {
    sprints,
    epics,
    meetings,
    isLoadingSprints,
    isLoadingEpics,
    isLoadingMeetings,
    createSprint: createSprintMutation.mutate,
    updateSprint: updateSprintMutation.mutate,
    deleteSprint: deleteSprintMutation.mutate,
    createEpic: createEpicMutation.mutate,
    updateEpic: updateEpicMutation.mutate,
    deleteEpic: deleteEpicMutation.mutate,
    createMeeting: createMeetingMutation.mutate,
    updateMeeting: updateMeetingMutation.mutate,
    deleteMeeting: deleteMeetingMutation.mutate,
    isCreatingSprint: createSprintMutation.isPending,
    isCreatingEpic: createEpicMutation.isPending,
    isCreatingMeeting: createMeetingMutation.isPending,
  };
};
