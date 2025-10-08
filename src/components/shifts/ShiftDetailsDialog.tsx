import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Edit, Copy, Trash2, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { useState } from "react";
import { DeleteShiftDialog } from "./DeleteShiftDialog";
import { EditShiftDialog } from "./EditShiftDialog";
import { CopyShiftDialog } from "./CopyShiftDialog";

interface ShiftDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: any;
}

export const ShiftDetailsDialog = ({ open, onOpenChange, shift }: ShiftDetailsDialogProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);

  if (!shift) return null;

  const handleEdit = () => {
    onOpenChange(false);
    setEditDialogOpen(true);
  };

  const handleCopy = () => {
    onOpenChange(false);
    setCopyDialogOpen(true);
  };

  const handleDelete = () => {
    onOpenChange(false);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Skiftdetaljer</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Shift details */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div 
                  className="w-4 h-4 rounded mt-1 flex-shrink-0" 
                  style={{ backgroundColor: shift.jobs?.color || "#3B82F6" }}
                />
                <div className="flex-1">
                  <div className="font-semibold text-lg">{shift.jobs?.name}</div>
                  {shift.jobs?.description && (
                    <div className="text-sm text-muted-foreground">{shift.jobs?.description}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Datum</div>
                    <div className="font-medium">
                      {format(parseISO(shift.date), "d MMMM yyyy", { locale: sv })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="text-xs text-muted-foreground">Tid</div>
                    <div className="font-medium">
                      {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <div className="text-xs text-muted-foreground">Timmar</div>
                  <div className="font-medium">{shift.hours}h</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Timlön</div>
                  <div className="font-medium">{shift.jobs?.hourly_rate} kr/h</div>
                </div>
              </div>

              {shift.notes && (
                <div className="pt-2 border-t">
                  <div className="text-xs text-muted-foreground mb-1">Anteckningar</div>
                  <div className="text-sm bg-muted p-3 rounded-md">{shift.notes}</div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 pt-2 border-t">
              <Button onClick={handleEdit} variant="default" className="w-full">
                <Edit className="h-4 w-4 mr-2" />
                Redigera skift
              </Button>
              <Button onClick={handleCopy} variant="outline" className="w-full">
                <Copy className="h-4 w-4 mr-2" />
                Kopiera skift
              </Button>
              <Button onClick={handleDelete} variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Ta bort skift
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-dialogs */}
      <DeleteShiftDialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen} 
        shift={shift} 
      />
      <EditShiftDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
        shift={shift} 
      />
      <CopyShiftDialog 
        open={copyDialogOpen} 
        onOpenChange={setCopyDialogOpen} 
        shift={shift} 
      />
    </>
  );
};
