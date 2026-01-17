import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Paperclip, Trash2, Download, Upload } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ProjectTask } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface TaskAttachment {
  id: string;
  user_id: string;
  task_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type?: string;
  created_at: string;
}

interface TaskDetailsDialogProps {
  task: ProjectTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updates: Partial<ProjectTask> & { id: string }) => void;
  onDelete: (id: string) => void;
}

const PRIORITIES = [
  { value: "low", label: "Låg" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "Hög" },
];

const STATUSES = [
  { value: "todo", label: "Att göra" },
  { value: "in_progress", label: "Pågående" },
  { value: "review", label: "Granskning" },
  { value: "done", label: "Klart" },
];

export function TaskDetailsDialog({ task, open, onOpenChange, onUpdate, onDelete }: TaskDetailsDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("todo");
  const [dueDate, setDueDate] = useState<Date | undefined>();

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority || "medium");
      setStatus(task.status);
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
    }
  }, [task]);

  // Fetch task attachments
  const { data: attachments, isLoading: isLoadingAttachments } = useQuery({
    queryKey: ["task_attachments", task?.id],
    queryFn: async () => {
      if (!task?.id) return [];
      const { data, error } = await supabase
        .from("project_task_attachments")
        .select("*")
        .eq("task_id", task.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TaskAttachment[];
    },
    enabled: !!task?.id && open,
  });

  // Upload attachment
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user?.id || !task?.id) throw new Error("User not authenticated");
      
      const filePath = `${user.id}/tasks/${task.id}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("project-attachments")
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data, error } = await supabase
        .from("project_task_attachments")
        .insert([{
          user_id: user.id,
          task_id: task.id,
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
      queryClient.invalidateQueries({ queryKey: ["task_attachments", task?.id] });
      toast({ title: "Fil uppladdad" });
    },
    onError: (error) => {
      toast({ title: "Fel vid uppladdning", description: error.message, variant: "destructive" });
    },
  });

  // Delete attachment
  const deleteMutation = useMutation({
    mutationFn: async ({ id, file_path }: { id: string; file_path: string }) => {
      const { error: storageError } = await supabase.storage
        .from("project-attachments")
        .remove([file_path]);
      
      if (storageError) throw storageError;
      
      const { error } = await supabase.from("project_task_attachments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task_attachments", task?.id] });
      toast({ title: "Fil borttagen" });
    },
    onError: (error) => {
      toast({ title: "Fel", description: error.message, variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
    e.target.value = "";
  };

  const handleDownload = async (attachment: TaskAttachment) => {
    const { data } = await supabase.storage
      .from("project-attachments")
      .createSignedUrl(attachment.file_path, 3600);
    
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  const handleSave = () => {
    if (!task) return;
    
    onUpdate({
      id: task.id,
      title,
      description: description || undefined,
      priority,
      status,
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : undefined,
    });
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!task) return;
    if (window.confirm("Är du säker på att du vill ta bort denna uppgift?")) {
      onDelete(task.id);
      onOpenChange(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Uppgiftsdetaljer</DialogTitle>
          <DialogDescription>Redigera uppgift och lägg till bilagor</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-title">Titel</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Uppgiftens titel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-description">Beskrivning</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Lägg till en beskrivning..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioritet</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Förfallodatum</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "d MMMM yyyy", { locale: sv }) : "Välj datum"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  locale={sv}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            {dueDate && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => setDueDate(undefined)}
              >
                Rensa datum
              </Button>
            )}
          </div>

          {/* Attachments section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Bilagor
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                <Upload className="h-4 w-4 mr-1" />
                {uploadMutation.isPending ? "Laddar upp..." : "Lägg till"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {isLoadingAttachments ? (
              <p className="text-sm text-muted-foreground">Laddar bilagor...</p>
            ) : attachments && attachments.length > 0 ? (
              <div className="space-y-2 max-h-[150px] overflow-y-auto">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm"
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="truncate font-medium">{attachment.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.file_size)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDownload(attachment)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteMutation.mutate({ id: attachment.id, file_path: attachment.file_path })}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Inga bilagor ännu</p>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Ta bort
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>
              <Button onClick={handleSave} disabled={!title.trim()}>
                Spara
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
