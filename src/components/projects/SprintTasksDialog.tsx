import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Zap, CalendarDays, Layers } from "lucide-react";
import { useProjectDetails, ProjectTask } from "@/hooks/useProjects";
import { ProjectSprint, useProjectExtras } from "@/hooks/useProjectExtras";
import { format, parseISO, differenceInDays, isAfter, isBefore } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface SprintTasksDialogProps {
  sprint: ProjectSprint | null;
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

const SPRINT_STATUSES: Record<string, { label: string; color: string }> = {
  planning: { label: "Planering", color: "bg-slate-500" },
  active: { label: "Aktiv", color: "bg-blue-500" },
  completed: { label: "Avslutad", color: "bg-green-500" },
};

export function SprintTasksDialog({ sprint, projectId, open, onOpenChange }: SprintTasksDialogProps) {
  const { tasks, updateTask } = useProjectDetails(projectId);
  const { epics } = useProjectExtras(projectId);
  
  const sprintTasks = tasks?.filter((t) => t.sprint_id === sprint?.id) || [];
  const todoTasks = sprintTasks.filter((t) => t.status === "todo");
  const inProgressTasks = sprintTasks.filter((t) => t.status === "in_progress");
  const reviewTasks = sprintTasks.filter((t) => t.status === "review");
  const doneTasks = sprintTasks.filter((t) => t.status === "done");

  const handleToggleComplete = (task: ProjectTask) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    updateTask({ id: task.id, status: newStatus });
  };

  const getEpicForTask = (epicId?: string) => {
    if (!epicId) return null;
    return epics?.find((e) => e.id === epicId);
  };

  const getSprintProgress = () => {
    if (!sprint?.start_date || !sprint?.end_date) return null;
    const start = parseISO(sprint.start_date);
    const end = parseISO(sprint.end_date);
    const today = new Date();
    
    if (isBefore(today, start)) return 0;
    if (isAfter(today, end)) return 100;
    
    const totalDays = differenceInDays(end, start);
    const elapsedDays = differenceInDays(today, start);
    return Math.round((elapsedDays / totalDays) * 100);
  };

  if (!sprint) return null;

  const statusInfo = SPRINT_STATUSES[sprint.status];
  const taskProgress = sprintTasks.length > 0 
    ? Math.round((doneTasks.length / sprintTasks.length) * 100) 
    : 0;
  const timeProgress = getSprintProgress();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {sprint.name}
            {statusInfo && (
              <Badge variant="outline" className="ml-2">
                <div className={cn("w-2 h-2 rounded-full mr-1.5", statusInfo.color)} />
                {statusInfo.label}
              </Badge>
            )}
          </DialogTitle>
          {sprint.goal && (
            <p className="text-sm text-muted-foreground mt-2">{sprint.goal}</p>
          )}
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Sprint info */}
          <div className="grid grid-cols-2 gap-4">
            {sprint.start_date && sprint.end_date && (
              <div className="text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    {format(parseISO(sprint.start_date), "d MMM", { locale: sv })} - {format(parseISO(sprint.end_date), "d MMM", { locale: sv })}
                  </span>
                </div>
              </div>
            )}
            <div className="text-sm text-right text-muted-foreground">
              {doneTasks.length}/{sprintTasks.length} uppgifter klara
            </div>
          </div>

          {/* Progress bars */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Uppgiftsframsteg</span>
                <span>{taskProgress}%</span>
              </div>
              <Progress value={taskProgress} className="h-2" />
            </div>
            {timeProgress !== null && sprint.status === "active" && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tid förbrukad</span>
                  <span>{timeProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${timeProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {sprintTasks.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Zap className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                Inga uppgifter i denna sprint
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Lägg till en sprint i uppgiftsdetaljer för att lägga till uppgifter
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <TaskSection 
                title="Att göra" 
                tasks={todoTasks} 
                onToggle={handleToggleComplete} 
                getEpic={getEpicForTask}
              />
              <TaskSection 
                title="Pågående" 
                tasks={inProgressTasks} 
                onToggle={handleToggleComplete}
                getEpic={getEpicForTask}
              />
              <TaskSection 
                title="Granskning" 
                tasks={reviewTasks} 
                onToggle={handleToggleComplete}
                getEpic={getEpicForTask}
              />
              <TaskSection 
                title="Klart" 
                tasks={doneTasks} 
                onToggle={handleToggleComplete}
                getEpic={getEpicForTask}
              />
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
  getEpic,
}: {
  title: string;
  tasks: ProjectTask[];
  onToggle: (task: ProjectTask) => void;
  getEpic: (epicId?: string) => { name: string; color: string } | null | undefined;
}) {
  if (tasks.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">{title} ({tasks.length})</h4>
      <div className="space-y-2">
        {tasks.map((task) => {
          const epic = getEpic(task.epic_id);
          return (
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
                      {epic && (
                        <div className="flex items-center gap-1">
                          <Layers className="h-3 w-3" style={{ color: epic.color }} />
                          <span className="text-xs" style={{ color: epic.color }}>
                            {epic.name}
                          </span>
                        </div>
                      )}
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
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
