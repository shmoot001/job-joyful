import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";

interface DeleteTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
}

export const DeleteTaskDialog = ({ open, onOpenChange, task }: DeleteTaskDialogProps) => {
  const { deleteTask, isDeleting } = useTasks();

  const handleDelete = () => {
    if (!task?.id) return;
    
    deleteTask(task.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>Ta bort uppgift</span>
          </DialogTitle>
          <DialogDescription>
            Är du säker på att du vill ta bort <strong>{task?.title}</strong>? 
            Denna åtgärd kan inte ångras.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Tar bort..." : "Ta bort"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};