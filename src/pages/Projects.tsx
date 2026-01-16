import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, FolderKanban, Settings2, ArrowLeft, Trash2, Calendar } from "lucide-react";
import { useProjects, useProjectDetails, Project } from "@/hooks/useProjects";
import { AddProjectDialog } from "@/components/projects/AddProjectDialog";
import { DeleteProjectDialog } from "@/components/projects/DeleteProjectDialog";
import { ManageProjectCategoriesDialog } from "@/components/projects/ManageProjectCategoriesDialog";
import { ProjectKanban } from "@/components/projects/ProjectKanban";
import { ProjectNotes } from "@/components/projects/ProjectNotes";
import { ProjectAttachments } from "@/components/projects/ProjectAttachments";
import { ProjectProgress } from "@/components/projects/ProjectProgress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  planning: { label: "Planering", color: "bg-slate-500" },
  active: { label: "Aktiv", color: "bg-blue-500" },
  on_hold: { label: "Pausad", color: "bg-yellow-500" },
  completed: { label: "Avslutad", color: "bg-green-500" },
};

const PRIORITY_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  low: { label: "Låg", variant: "secondary" },
  medium: { label: "Medium", variant: "default" },
  high: { label: "Hög", variant: "destructive" },
};

export default function Projects() {
  const { projects, projectCategories, isLoadingProjects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCategoriesDialogOpen, setIsCategoriesDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);

  const { tasks } = useProjectDetails(selectedProject?.id);

  const getProgressForProject = (projectId: string) => {
    const projectTasks = tasks?.filter((t) => t.project_id === projectId) || [];
    const total = projectTasks.length;
    const completed = projectTasks.filter((t) => t.status === "done").length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getCategoryForProject = (categoryId?: string) => {
    if (!categoryId) return null;
    return projectCategories?.find((c) => c.id === categoryId);
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete({ id: project.id, name: project.name });
    setIsDeleteDialogOpen(true);
  };

  if (isLoadingProjects) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Project detail view
  if (selectedProject) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedProject(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{selectedProject.name}</h1>
            {selectedProject.description && (
              <p className="text-muted-foreground">{selectedProject.description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={() => handleDeleteProject(selectedProject)}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Project info bar */}
        <div className="flex flex-wrap items-center gap-4">
          {getCategoryForProject(selectedProject.category_id) && (
            <Badge
              variant="outline"
              style={{
                borderColor: getCategoryForProject(selectedProject.category_id)?.color,
                color: getCategoryForProject(selectedProject.category_id)?.color,
              }}
            >
              {getCategoryForProject(selectedProject.category_id)?.name}
            </Badge>
          )}
          <Badge variant={PRIORITY_LABELS[selectedProject.priority]?.variant || "default"}>
            {PRIORITY_LABELS[selectedProject.priority]?.label || selectedProject.priority}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <div
              className={`w-2 h-2 rounded-full ${STATUS_LABELS[selectedProject.status]?.color || "bg-slate-500"}`}
            />
            {STATUS_LABELS[selectedProject.status]?.label || selectedProject.status}
          </div>
          {selectedProject.due_date && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(new Date(selectedProject.due_date), "d MMMM yyyy", { locale: sv })}
            </div>
          )}
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="pt-4">
            <ProjectProgress projectId={selectedProject.id} />
          </CardContent>
        </Card>

        {/* Tabs for Kanban, Notes, Attachments */}
        <Tabs defaultValue="kanban" className="space-y-4">
          <TabsList>
            <TabsTrigger value="kanban">Uppgifter</TabsTrigger>
            <TabsTrigger value="notes">Plan & Anteckningar</TabsTrigger>
            <TabsTrigger value="attachments">Bilagor</TabsTrigger>
          </TabsList>

          <TabsContent value="kanban">
            <ProjectKanban projectId={selectedProject.id} />
          </TabsContent>

          <TabsContent value="notes">
            <ProjectNotes projectId={selectedProject.id} />
          </TabsContent>

          <TabsContent value="attachments">
            <ProjectAttachments projectId={selectedProject.id} />
          </TabsContent>
        </Tabs>

        <DeleteProjectDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          project={projectToDelete}
          onDeleted={() => setSelectedProject(null)}
        />
      </div>
    );
  }

  // Projects list view
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderKanban className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Projekt</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setIsCategoriesDialogOpen(true)}>
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nytt projekt
          </Button>
        </div>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const category = getCategoryForProject(project.category_id);
            const status = STATUS_LABELS[project.status] || { label: project.status, color: "bg-slate-500" };
            const priority = PRIORITY_LABELS[project.priority] || { label: project.priority, variant: "default" as const };

            return (
              <Card
                key={project.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setSelectedProject(project)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                    <Badge variant={priority.variant}>{priority.label}</Badge>
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {category && (
                      <Badge
                        variant="outline"
                        style={{ borderColor: category.color, color: category.color }}
                      >
                        {category.name}
                      </Badge>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <div className={`w-2 h-2 rounded-full ${status.color}`} />
                      {status.label}
                    </div>
                  </div>

                  {project.due_date && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(project.due_date), "d MMM yyyy", { locale: sv })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Inga projekt ännu</h3>
            <p className="text-muted-foreground mb-4">
              Skapa ditt första projekt för att börja organisera ditt arbete.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Skapa projekt
            </Button>
          </CardContent>
        </Card>
      )}

      <AddProjectDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      <ManageProjectCategoriesDialog
        open={isCategoriesDialogOpen}
        onOpenChange={setIsCategoriesDialogOpen}
      />
      <DeleteProjectDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        project={projectToDelete}
      />
    </div>
  );
}
