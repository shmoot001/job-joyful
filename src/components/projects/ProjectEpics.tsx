import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Layers, Trash2, Edit } from "lucide-react";
import { useProjectExtras, ProjectEpic } from "@/hooks/useProjectExtras";
import { useProjectDetails } from "@/hooks/useProjects";

interface ProjectEpicsProps {
  projectId: string;
}

const EPIC_COLORS = [
  { value: "#8B5CF6", label: "Lila" },
  { value: "#3B82F6", label: "Blå" },
  { value: "#10B981", label: "Grön" },
  { value: "#F59E0B", label: "Orange" },
  { value: "#EF4444", label: "Röd" },
  { value: "#EC4899", label: "Rosa" },
  { value: "#6366F1", label: "Indigo" },
  { value: "#14B8A6", label: "Teal" },
];

const EPIC_STATUSES = [
  { value: "open", label: "Öppen" },
  { value: "in_progress", label: "Pågående" },
  { value: "done", label: "Klar" },
];

export function ProjectEpics({ projectId }: ProjectEpicsProps) {
  const { epics, isLoadingEpics, createEpic, updateEpic, deleteEpic, isCreatingEpic } =
    useProjectExtras(projectId);
  const { tasks } = useProjectDetails(projectId);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEpic, setEditingEpic] = useState<ProjectEpic | null>(null);
  const [epicToDelete, setEpicToDelete] = useState<ProjectEpic | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#8B5CF6");
  const [status, setStatus] = useState("open");

  const resetForm = () => {
    setName("");
    setDescription("");
    setColor("#8B5CF6");
    setStatus("open");
    setEditingEpic(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (epic: ProjectEpic) => {
    setEditingEpic(epic);
    setName(epic.name);
    setDescription(epic.description || "");
    setColor(epic.color);
    setStatus(epic.status);
    setIsAddDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    const epicData = {
      project_id: projectId,
      name,
      description: description || undefined,
      color,
      status,
    };

    if (editingEpic) {
      updateEpic({ id: editingEpic.id, ...epicData });
    } else {
      createEpic(epicData);
    }

    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleDelete = () => {
    if (epicToDelete) {
      deleteEpic(epicToDelete.id);
      setEpicToDelete(null);
    }
  };

  const getTaskCountForEpic = (epicId: string) => {
    return tasks?.filter((t) => t.epic_id === epicId).length || 0;
  };

  const getCompletedTaskCountForEpic = (epicId: string) => {
    return tasks?.filter((t) => t.epic_id === epicId && t.status === "done").length || 0;
  };

  if (isLoadingEpics) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Epics</h3>
        <Button onClick={handleOpenAddDialog} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Ny Epic
        </Button>
      </div>

      {epics && epics.length > 0 ? (
        <div className="grid gap-3">
          {epics.map((epic) => {
            const taskCount = getTaskCountForEpic(epic.id);
            const completedCount = getCompletedTaskCountForEpic(epic.id);
            const statusInfo = EPIC_STATUSES.find((s) => s.value === epic.status);

            return (
              <Card key={epic.id} className="overflow-hidden">
                <div
                  className="h-1"
                  style={{ backgroundColor: epic.color }}
                />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4" style={{ color: epic.color }} />
                        <h4 className="font-medium truncate">{epic.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {statusInfo?.label || epic.status}
                        </Badge>
                      </div>

                      {epic.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {epic.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>
                          {completedCount}/{taskCount} uppgifter klara
                        </span>
                        {taskCount > 0 && (
                          <div className="flex-1 max-w-[100px] h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(completedCount / taskCount) * 100}%`,
                                backgroundColor: epic.color,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEditDialog(epic)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setEpicToDelete(epic)}
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
            <Layers className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Inga epics skapade</p>
            <Button onClick={handleOpenAddDialog} variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Skapa första epic
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingEpic ? "Redigera Epic" : "Ny Epic"}</DialogTitle>
            <DialogDescription>
              {editingEpic
                ? "Uppdatera epic-detaljer"
                : "Skapa en ny epic för att gruppera relaterade uppgifter"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Namn *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Epic-namn"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beskrivning</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beskriv vad denna epic handlar om"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Färg</Label>
                <Select value={color} onValueChange={setColor}>
                  <SelectTrigger>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        {EPIC_COLORS.find((c) => c.value === color)?.label}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {EPIC_COLORS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: c.value }}
                          />
                          {c.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EPIC_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSubmit} disabled={!name.trim() || isCreatingEpic}>
              {isCreatingEpic ? "Sparar..." : editingEpic ? "Uppdatera" : "Skapa Epic"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!epicToDelete} onOpenChange={() => setEpicToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ta bort Epic</DialogTitle>
            <DialogDescription>
              Är du säker på att du vill ta bort "{epicToDelete?.name}"? Uppgifter kopplade till
              denna epic kommer att kvarstå men förlora sin epic-koppling.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEpicToDelete(null)}>
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
