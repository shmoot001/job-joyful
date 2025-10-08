import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Edit, Trash2, CheckCircle2, Circle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { useState } from "react";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { EditTaskDialog } from "./EditTaskDialog";
import { useTasks } from "@/hooks/useTasks";
import { Badge } from "@/components/ui/badge";

interface TaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
}

export const TaskDetailsDialog = ({ open, onOpenChange, task }: TaskDetailsDialogProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toggleTaskComplete } = useTasks();

  if (!task) return null;

  const handleEdit = () => {
    onOpenChange(false);
    setEditDialogOpen(true);
  };

  const handleDelete = () => {
    onOpenChange(false);
    setDeleteDialogOpen(true);
  };

  const handleToggleComplete = () => {
    toggleTaskComplete(task.id, !task.completed);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Uppgiftsdetaljer</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Task details */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                {task.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className={`font-semibold text-lg ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </div>
                  <div className="mt-1">
                    <Badge variant={task.completed ? "secondary" : "default"}>
                      {task.category}
                    </Badge>
                  </div>
                </div>
              </div>

              {task.description && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Beskrivning</div>
                  <div className="text-sm bg-muted p-3 rounded-md">{task.description}</div>
                </div>
              )}

              {task.deadline && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Deadline</div>
                    <div className="font-medium">
                      {format(parseISO(task.deadline), "d MMMM yyyy", { locale: sv })}
                    </div>
                  </div>
                </div>
              )}

              {task.completed && task.completed_at && (
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground">Slutförd</div>
                  <div className="text-sm font-medium text-green-600">
                    {format(parseISO(task.completed_at), "d MMMM yyyy 'kl.' HH:mm", { locale: sv })}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 pt-2 border-t">
              <Button 
                onClick={handleToggleComplete} 
                variant={task.completed ? "outline" : "default"}
                className="w-full"
              >
                {task.completed ? (
                  <>
                    <Circle className="h-4 w-4 mr-2" />
                    Markera som ej slutförd
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Markera som slutförd
                  </>
                )}
              </Button>
              <Button onClick={handleEdit} variant="outline" className="w-full">
                <Edit className="h-4 w-4 mr-2" />
                Redigera uppgift
              </Button>
              <Button onClick={handleDelete} variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Ta bort uppgift
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-dialogs */}
      <DeleteTaskDialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen} 
        task={task} 
      />
      <EditTaskDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
        task={task} 
      />
    </>
  );
};
