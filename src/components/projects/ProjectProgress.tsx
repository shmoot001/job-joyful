import { Progress } from "@/components/ui/progress";
import { useProjectDetails } from "@/hooks/useProjects";

interface ProjectProgressProps {
  projectId: string;
}

export function ProjectProgress({ projectId }: ProjectProgressProps) {
  const { tasks } = useProjectDetails(projectId);

  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((t) => t.status === "done").length || 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Framsteg</span>
        <span className="font-medium">{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
      <p className="text-xs text-muted-foreground">
        {completedTasks} av {totalTasks} uppgifter klara
      </p>
    </div>
  );
}
