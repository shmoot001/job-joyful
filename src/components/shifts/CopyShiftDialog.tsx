import { useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useShifts, Shift } from "@/hooks/useShifts";
import { cn } from "@/lib/utils";

interface CopyShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: Shift | null;
}

export const CopyShiftDialog = ({ open, onOpenChange, shift }: CopyShiftDialogProps) => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const { createShift, isCreating } = useShifts();

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const dateExists = selectedDates.some(selectedDate => 
      selectedDate.toDateString() === date.toDateString()
    );
    
    if (dateExists) {
      // Remove date if already selected
      setSelectedDates(prev => prev.filter(selectedDate => 
        selectedDate.toDateString() !== date.toDateString()
      ));
    } else {
      // Add date
      setSelectedDates(prev => [...prev, date]);
    }
  };

  const removeDate = (dateToRemove: Date) => {
    setSelectedDates(prev => prev.filter(date => 
      date.toDateString() !== dateToRemove.toDateString()
    ));
  };

  const handleCopyShift = async () => {
    if (!shift || selectedDates.length === 0) return;

    const copyPromises = selectedDates.map(date => {
      const shiftData = {
        job_id: shift.job_id,
        date: format(date, 'yyyy-MM-dd'),
        start_time: shift.start_time,
        end_time: shift.end_time,
        hours: shift.hours,
        notes: shift.notes ? `${shift.notes} (kopierat)` : 'Kopierat skift',
      };
      
      return new Promise((resolve) => {
        createShift(shiftData);
        resolve(true);
      });
    });

    await Promise.all(copyPromises);
    
    // Reset and close
    setSelectedDates([]);
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedDates([]);
    onOpenChange(false);
  };

  if (!shift) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Kopiera skift</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Shift info */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: shift.jobs?.color || "#3B82F6" }}
              />
              <span className="font-medium">{shift.jobs?.name}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(shift.date), "d MMMM yyyy", { locale: sv })} • {shift.start_time.slice(0, 5)}-{shift.end_time.slice(0, 5)}
            </div>
            {shift.hours && (
              <div className="text-sm text-muted-foreground">
                {shift.hours} timmar
              </div>
            )}
          </div>

          {/* Selected dates */}
          {selectedDates.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Valda datum ({selectedDates.length})</h4>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {selectedDates.map(date => (
                  <Badge key={date.toISOString()} variant="secondary" className="flex items-center gap-1">
                    {format(date, "d MMM", { locale: sv })}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeDate(date)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Calendar */}
          <div className="border rounded-lg p-2">
            <h4 className="text-sm font-medium mb-2">Välj datum att kopiera till</h4>
            <Calendar
              mode="single"
              selected={undefined}
              onSelect={handleDateSelect}
              className={cn("pointer-events-auto")}
              modifiers={{
                selected: selectedDates
              }}
              modifiersClassNames={{
                selected: "bg-primary text-primary-foreground"
              }}
              disabled={(date) => {
                // Disable past dates and the original shift date
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const shiftDate = new Date(shift.date);
                shiftDate.setHours(0, 0, 0, 0);
                
                return date < today || date.toDateString() === shiftDate.toDateString();
              }}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Avbryt
            </Button>
            <Button 
              onClick={handleCopyShift} 
              disabled={selectedDates.length === 0 || isCreating}
            >
              {isCreating ? "Kopierar..." : `Kopiera till ${selectedDates.length} datum`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};