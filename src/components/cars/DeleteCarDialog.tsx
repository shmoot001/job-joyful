import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useCars, Car } from "@/hooks/useCars";

interface DeleteCarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car: Car | null;
}

export const DeleteCarDialog = ({ open, onOpenChange, car }: DeleteCarDialogProps) => {
  const { deleteCar, isDeleting } = useCars();

  const handleDelete = () => {
    if (!car?.id) return;
    
    deleteCar(car.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>Ta bort bil</span>
          </DialogTitle>
          <DialogDescription>
            Är du säker på att du vill ta bort <strong>{car?.car_number} - {car?.model}</strong>? 
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
