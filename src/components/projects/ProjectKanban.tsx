import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, GripVertical, CalendarDays, Layers, Zap } from "lucide-react";
import { useProjectDetails, ProjectTask } from "@/hooks/useProjects";
import { useProjectExtras } from "@/hooks/useProjectExtras";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { TaskDetailsDialog } from "./TaskDetailsDialog";

interface ProjectKanbanProps {
  projectId: string;
}

const COLUMNS = [
  { id: "todo", label: "Att göra", color: "bg-slate-500" },
  { id: "in_progress", label: "Pågående", color: "bg-blue-500" },
  { id: "review", label: "Granskning", color: "bg-yellow-500" },
  { id: "done", label: "Klart", color: "bg-green-500" },
];

const PRIORITIES = {
  low: { label: "Låg", color: "bg-slate-400" },
  medium: { label: "Medium", color: "bg-yellow-400" },
  high: { label: "Hög", color: "bg-red-400" },
};

export function ProjectKanban({ projectId }: ProjectKanbanProps) {
  const { tasks, createTask, updateTask, deleteTask } = useProjectDetails(projectId);
  const { epics, sprints } = useProjectExtras(projectId);
  const [newTaskTitle, setNewTaskTitle] = useState<Record<string, string>>({});
  const [draggedTask, setDraggedTask] = useState<ProjectTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const getEpicById = (epicId?: string) => epics?.find((e) => e.id === epicId);
  const getSprintById = (sprintId?: string) => sprints?.find((s) => s.id === sprintId);

  const getTasksByStatus = (status: string) => {
    return tasks?.filter((task) => task.status === status) || [];
  };

  const handleAddTask = (status: string) => {
    const title = newTaskTitle[status]?.trim();
    if (!title) return;

    const tasksInColumn = getTasksByStatus(status);
    createTask({
      project_id: projectId,
      title,
      status,
      priority: "medium",
      position: tasksInColumn.length,
    });
    setNewTaskTitle((prev) => ({ ...prev, [status]: "" }));
  };

  const handleDragStart = (task: ProjectTask) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: string) => {
    if (draggedTask && draggedTask.status !== status) {
      const tasksInColumn = getTasksByStatus(status);
      updateTask({
        id: draggedTask.id,
        status,
        position: tasksInColumn.length,
      });
    }
    setDraggedTask(null);
  };

  const handleTaskClick = (task: ProjectTask) => {
    setSelectedTask(task);
    setDetailsOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((column) => (
          <Card
            key={column.id}
            className="min-h-[400px]"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                {column.label}
                <Badge variant="secondary" className="ml-auto">
                  {getTasksByStatus(column.id).length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Add new task input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Ny uppgift..."
                  value={newTaskTitle[column.id] || ""}
                  onChange={(e) =>
                    setNewTaskTitle((prev) => ({ ...prev, [column.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddTask(column.id);
                  }}
                  className="text-sm"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleAddTask(column.id)}
                  disabled={!newTaskTitle[column.id]?.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Task cards */}
              <div className="space-y-2">
                {getTasksByStatus(column.id).map((task) => {
                  const epic = getEpicById(task.epic_id);
                  const sprint = getSprintById(task.sprint_id);
                  
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      onClick={() => handleTaskClick(task)}
                      className="group p-3 bg-muted/50 rounded-lg border cursor-pointer active:cursor-grabbing hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          
                          {/* Epic and Sprint tags */}
                          {(epic || sprint) && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              {epic && (
                                <Badge 
                                  variant="outline" 
                                  className="text-[10px] px-1.5 py-0"
                                  style={{ borderColor: epic.color, color: epic.color }}
                                >
                                  <Layers className="h-2.5 w-2.5 mr-0.5" />
                                  {epic.name}
                                </Badge>
                              )}
                              {sprint && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  <Zap className="h-2.5 w-2.5 mr-0.5" />
                                  {sprint.name}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {task.due_date && (
                            <div className="flex items-center gap-1.5 mt-2 px-2 py-1 bg-primary/10 rounded-md w-fit">
                              <CalendarDays className="h-3.5 w-3.5 text-primary" />
                              <span className="text-xs font-medium text-primary">
                                {format(new Date(task.due_date), "d MMMM yyyy", { locale: sv })}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className={`text-xs ${PRIORITIES[task.priority as keyof typeof PRIORITIES]?.color || ""}`}
                            >
                              {PRIORITIES[task.priority as keyof typeof PRIORITIES]?.label || task.priority}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTask(task.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <TaskDetailsDialog
        task={selectedTask}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onUpdate={updateTask}
        onDelete={deleteTask}
        projectId={projectId}
      />
    </>
  );
}
