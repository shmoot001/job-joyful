import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { useShifts } from "@/hooks/useShifts";
import { cn } from "@/lib/utils";
import { CalendarIcon, Copy, Plus } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface CopyShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: any;
}

export const CopyShiftDialog = ({ open, onOpenChange, shift }: CopyShiftDialogProps) => {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const { createShift, isCreating } = useShifts();

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDates(prev => {
      const dateString = date.toISOString().split('T')[0];
      const existingIndex = prev.findIndex(d => d.toISOString().split('T')[0] === dateString);
      
      if (existingIndex >= 0) {
        // Remove date if already selected
        return prev.filter((_, index) => index !== existingIndex);
      } else {
        // Add date if not selected
        return [...prev, date];
      }
    });
  };

  const calculateHours = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startDate = new Date();
    startDate.setHours(startHour, startMinute, 0, 0);
    
    const endDate = new Date();
    endDate.setHours(endHour, endMinute, 0, 0);
    
    // Handle overnight shifts
    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1);
    }
    
    const diffMs = endDate.getTime() - startDate.getTime();
    return diffMs / (1000 * 60 * 60); // Convert to hours
  };

  const handleCopyShift = () => {
    if (!shift || selectedDates.length === 0) return;

    selectedDates.forEach(date => {
      // Calculate hours if not available
      const calculatedHours = shift.hours || calculateHours(shift.start_time, shift.end_time);
      
      const newShift = {
        job_id: shift.job_id,
        date: date.toISOString().split('T')[0],
        start_time: shift.start_time,
        end_time: shift.end_time,
        hours: calculatedHours,
        notes: shift.notes,
      };
      
      createShift(newShift);
    });

    // Reset and close
    setSelectedDates([]);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedDates([]);
    onOpenChange(false);
  };

  if (!shift) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Copy className="h-5 w-5" />
            <span>Kopiera Skift</span>
          </DialogTitle>
          <DialogDescription>
            Välj datum att kopiera skiftet till. Du kan välja flera datum genom att klicka på dem.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Original shift info */}
          <div className="bg-muted p-3 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Skift att kopiera:</h4>
            <div className="text-sm space-y-1">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: shift.jobs?.color }}
                />
                <span>{shift.jobs?.name}</span>
              </div>
              <div>Tid: {shift.start_time} - {shift.end_time}</div>
              {shift.hours && <div>Timmar: {shift.hours}h</div>}
            </div>
          </div>

          {/* Calendar for date selection */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={undefined}
              onSelect={handleDateSelect}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
              modifiers={{
                selected: selectedDates
              }}
              modifiersStyles={{
                selected: { 
                  backgroundColor: 'hsl(var(--primary))', 
                  color: 'hsl(var(--primary-foreground))' 
                }
              }}
              locale={sv}
            />
          </div>

          {/* Selected dates summary */}
          {selectedDates.length > 0 && (
            <div className="bg-primary/10 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Valda datum ({selectedDates.length}):</h4>
              <div className="flex flex-wrap gap-1">
                {selectedDates.map((date, index) => (
                  <span 
                    key={index}
                    className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded"
                  >
                    {format(date, 'dd MMM', { locale: sv })}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Avbryt
          </Button>
          <Button 
            onClick={handleCopyShift} 
            disabled={selectedDates.length === 0 || isCreating}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>
              {isCreating ? 'Kopierar...' : `Kopiera till ${selectedDates.length} datum`}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};