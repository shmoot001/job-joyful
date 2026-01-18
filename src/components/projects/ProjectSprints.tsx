import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Zap, CalendarDays, Trash2, Edit } from "lucide-react";
import { useProjectExtras, ProjectSprint } from "@/hooks/useProjectExtras";
import { useProjectDetails } from "@/hooks/useProjects";
import { format, parseISO, differenceInDays, isAfter, isBefore } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ProjectSprintsProps {
  projectId: string;
}

const SPRINT_STATUSES = [
  { value: "planning", label: "Planering", color: "bg-slate-500" },
  { value: "active", label: "Aktiv", color: "bg-blue-500" },
  { value: "completed", label: "Avslutad", color: "bg-green-500" },
];

export function ProjectSprints({ projectId }: ProjectSprintsProps) {
  const { sprints, isLoadingSprints, createSprint, updateSprint, deleteSprint, isCreatingSprint } =
    useProjectExtras(projectId);
  const { tasks } = useProjectDetails(projectId);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState<ProjectSprint | null>(null);
  const [sprintToDelete, setSprintToDelete] = useState<ProjectSprint | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [status, setStatus] = useState("planning");

  const resetForm = () => {
    setName("");
    setGoal("");
    setStartDate(new Date());
    setEndDate(undefined);
    setStatus("planning");
    setEditingSprint(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (sprint: ProjectSprint) => {
    setEditingSprint(sprint);
    setName(sprint.name);
    setGoal(sprint.goal || "");
    setStartDate(sprint.start_date ? parseISO(sprint.start_date) : undefined);
    setEndDate(sprint.end_date ? parseISO(sprint.end_date) : undefined);
    setStatus(sprint.status);
    setIsAddDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    const sprintData = {
      project_id: projectId,
      name,
      goal: goal || undefined,
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
      status,
    };

    if (editingSprint) {
      updateSprint({ id: editingSprint.id, ...sprintData });
    } else {
      createSprint(sprintData);
    }

    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleDelete = () => {
    if (sprintToDelete) {
      deleteSprint(sprintToDelete.id);
      setSprintToDelete(null);
    }
  };

  const getTaskCountForSprint = (sprintId: string) => {
    return tasks?.filter((t) => t.sprint_id === sprintId).length || 0;
  };

  const getCompletedTaskCountForSprint = (sprintId: string) => {
    return tasks?.filter((t) => t.sprint_id === sprintId && t.status === "done").length || 0;
  };

  const getSprintProgress = (sprint: ProjectSprint) => {
    if (!sprint.start_date || !sprint.end_date) return null;
    const start = parseISO(sprint.start_date);
    const end = parseISO(sprint.end_date);
    const today = new Date();
    
    if (isBefore(today, start)) return 0;
    if (isAfter(today, end)) return 100;
    
    const totalDays = differenceInDays(end, start);
    const elapsedDays = differenceInDays(today, start);
    return Math.round((elapsedDays / totalDays) * 100);
  };

  if (isLoadingSprints) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Sprints</h3>
        <Button onClick={handleOpenAddDialog} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Ny Sprint
        </Button>
      </div>

      {sprints && sprints.length > 0 ? (
        <div className="grid gap-3">
          {sprints.map((sprint) => {
            const taskCount = getTaskCountForSprint(sprint.id);
            const completedCount = getCompletedTaskCountForSprint(sprint.id);
            const statusInfo = SPRINT_STATUSES.find((s) => s.value === sprint.status);
            const timeProgress = getSprintProgress(sprint);

            return (
              <Card key={sprint.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <h4 className="font-medium truncate">{sprint.name}</h4>
                        <div className="flex items-center gap-1">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              statusInfo?.color || "bg-slate-500"
                            )}
                          />
                          <span className="text-xs text-muted-foreground">
                            {statusInfo?.label || sprint.status}
                          </span>
                        </div>
                      </div>

                      {sprint.goal && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {sprint.goal}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {sprint.start_date && sprint.end_date && (
                          <div className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {format(parseISO(sprint.start_date), "d MMM", { locale: sv })} -{" "}
                            {format(parseISO(sprint.end_date), "d MMM", { locale: sv })}
                          </div>
                        )}
                        <span>
                          {completedCount}/{taskCount} uppgifter klara
                        </span>
                      </div>

                      {/* Progress bars */}
                      <div className="mt-3 space-y-2">
                        {taskCount > 0 && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Uppgifter</span>
                              <span>{Math.round((completedCount / taskCount) * 100)}%</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${(completedCount / taskCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {timeProgress !== null && sprint.status === "active" && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Tid</span>
                              <span>{timeProgress}%</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full transition-all"
                                style={{ width: `${timeProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEditDialog(sprint)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setSprintToDelete(sprint)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <Zap className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Inga sprints skapade</p>
            <Button onClick={handleOpenAddDialog} variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Skapa första sprint
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingSprint ? "Redigera Sprint" : "Ny Sprint"}</DialogTitle>
            <DialogDescription>
              {editingSprint
                ? "Uppdatera sprint-detaljer"
                : "Skapa en ny sprint för tidsbegränsat arbete"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Namn *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="t.ex. Sprint 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Sprint-mål</Label>
              <Textarea
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Vad ska uppnås i denna sprint?"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Startdatum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "d MMM", { locale: sv }) : "Välj"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Slutdatum</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "d MMM", { locale: sv }) : "Välj"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPRINT_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", s.color)} />
                        {s.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSubmit} disabled={!name.trim() || isCreatingSprint}>
              {isCreatingSprint ? "Sparar..." : editingSprint ? "Uppdatera" : "Skapa Sprint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!sprintToDelete} onOpenChange={() => setSprintToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ta bort Sprint</DialogTitle>
            <DialogDescription>
              Är du säker på att du vill ta bort "{sprintToDelete?.name}"? Uppgifter kopplade till
              denna sprint kommer att kvarstå men förlora sin sprint-koppling.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSprintToDelete(null)}>
              Avbryt
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Ta bort
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
