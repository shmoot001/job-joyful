import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Layers, CalendarDays, GripVertical } from "lucide-react";
import { useProjectDetails, ProjectTask } from "@/hooks/useProjects";
import { ProjectEpic } from "@/hooks/useProjectExtras";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface EpicTasksDialogProps {
  epic: ProjectEpic | null;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-slate-500",
  medium: "bg-amber-500",
  high: "bg-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  todo: "Att göra",
  in_progress: "Pågående",
  review: "Granskning",
  done: "Klart",
};

export function EpicTasksDialog({ epic, projectId, open, onOpenChange }: EpicTasksDialogProps) {
  const { tasks, updateTask } = useProjectDetails(projectId);
  
  const epicTasks = tasks?.filter((t) => t.epic_id === epic?.id) || [];
  const todoTasks = epicTasks.filter((t) => t.status === "todo");
  const inProgressTasks = epicTasks.filter((t) => t.status === "in_progress");
  const reviewTasks = epicTasks.filter((t) => t.status === "review");
  const doneTasks = epicTasks.filter((t) => t.status === "done");

  const handleToggleComplete = (task: ProjectTask) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    updateTask({ id: task.id, status: newStatus });
  };

  if (!epic) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: epic.color }}
            />
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" style={{ color: epic.color }} />
              {epic.name}
            </DialogTitle>
          </div>
          {epic.description && (
            <p className="text-sm text-muted-foreground mt-2">{epic.description}</p>
          )}
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{epicTasks.length} uppgifter</span>
            <span>{doneTasks.length} klara</span>
          </div>

          {epicTasks.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Layers className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                Inga uppgifter kopplade till denna epic
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Lägg till en epic i uppgiftsdetaljer för att koppla uppgifter
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <TaskSection title="Att göra" tasks={todoTasks} onToggle={handleToggleComplete} epicColor={epic.color} />
              <TaskSection title="Pågående" tasks={inProgressTasks} onToggle={handleToggleComplete} epicColor={epic.color} />
              <TaskSection title="Granskning" tasks={reviewTasks} onToggle={handleToggleComplete} epicColor={epic.color} />
              <TaskSection title="Klart" tasks={doneTasks} onToggle={handleToggleComplete} epicColor={epic.color} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TaskSection({
  title,
  tasks,
  onToggle,
  epicColor,
}: {
  title: string;
  tasks: ProjectTask[];
  onToggle: (task: ProjectTask) => void;
  epicColor: string;
}) {
  if (tasks.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{title} ({tasks.length})</h4>
      <div className="space-y-2">
        {tasks.map((task) => (
          <Card key={task.id} className={cn(task.status === "done" && "opacity-60")}>
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={task.status === "done"}
                  onCheckedChange={() => onToggle(task)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium text-sm",
                    task.status === "done" && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {task.priority && (
                      <div className="flex items-center gap-1">
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            PRIORITY_COLORS[task.priority] || "bg-slate-500"
                          )}
                        />
                        <span className="text-xs text-muted-foreground capitalize">
                          {task.priority}
                        </span>
                      </div>
                    )}
                    {task.due_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {format(parseISO(task.due_date), "d MMM", { locale: sv })}
                      </div>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {STATUS_LABELS[task.status] || task.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
