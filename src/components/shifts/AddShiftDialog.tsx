import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useShifts } from "@/hooks/useShifts";
import { useJobs } from "@/hooks/useJobs";
import { format } from "date-fns";

interface AddShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date | null;
}

export const AddShiftDialog = ({ open, onOpenChange, selectedDate }: AddShiftDialogProps) => {
  const { createShift, isCreating } = useShifts();
  const { jobs } = useJobs();
  const [formData, setFormData] = useState({
    job_id: "",
    date: "",
    start_time: "",
    end_time: "",
    hours: "",
    notes: "",
  });

  const calculateHours = (startTime: string, endTime: string, breakTimeMinutes: number = 0): number => {
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
    const totalHours = diffMs / (1000 * 60 * 60); // Convert to hours
    const breakHours = breakTimeMinutes / 60;
    
    return Math.max(0, totalHours - breakHours); // Subtract break time but don't go negative
  };

  // Set date when selectedDate changes
  useEffect(() => {
    if (selectedDate && open) {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      setFormData(prev => ({ ...prev, date: dateString }));
    }
  }, [selectedDate, open]);

  // Auto-calculate hours when start_time, end_time, or job changes
  useEffect(() => {
    if (formData.start_time && formData.end_time && formData.job_id && !formData.hours) {
      const selectedJob = jobs?.find(job => job.id === formData.job_id);
      const breakTime = selectedJob?.break_time || 0;
      const calculatedHours = calculateHours(formData.start_time, formData.end_time, breakTime);
      if (calculatedHours >= 0) {
        setFormData(prev => ({ ...prev, hours: calculatedHours.toString() }));
      }
    }
  }, [formData.start_time, formData.end_time, formData.job_id, jobs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate hours if not provided
    const selectedJob = jobs?.find(job => job.id === formData.job_id);
    const breakTime = selectedJob?.break_time || 0;
    const calculatedHours = formData.hours 
      ? parseFloat(formData.hours) 
      : calculateHours(formData.start_time, formData.end_time, breakTime);
    
    const shiftData: any = {
      job_id: formData.job_id,
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      hours: calculatedHours,
      notes: formData.notes || undefined,
    };

    createShift(shiftData);
    
    setFormData({
      job_id: "",
      date: "",
      start_time: "",
      end_time: "",
      hours: "",
      notes: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Lägg till nytt skift</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="job_id">Jobb</Label>
            <Select value={formData.job_id} onValueChange={(value) => setFormData(prev => ({ ...prev, job_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Välj jobb" />
              </SelectTrigger>
              <SelectContent>
                {jobs?.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: job.color }}
                      />
                      <span>{job.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date">Datum</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Starttid</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, start_time: e.target.value }));
                  // Clear hours field to trigger auto-calculation
                  if (formData.end_time && formData.job_id) {
                    setFormData(prev => ({ ...prev, hours: "" }));
                  }
                }}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end_time">Sluttid</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, end_time: e.target.value }));
                  // Clear hours field to trigger auto-calculation
                  if (formData.start_time && formData.job_id) {
                    setFormData(prev => ({ ...prev, hours: "" }));
                  }
                }}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours">Arbetstimmar (exkl. rast)</Label>
            <Input
              id="hours"
              type="number"
              step="0.5"
              min="0"
              placeholder="Arbetstimmar automatiskt beräknat"
              value={formData.hours}
              onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
            />
            {formData.job_id && jobs?.find(job => job.id === formData.job_id)?.break_time > 0 && (
              <p className="text-sm text-muted-foreground">
                Rasttid ({jobs.find(job => job.id === formData.job_id)?.break_time} min) dras automatiskt av
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Anteckningar (valfritt)</Label>
            <Textarea
              id="notes"
              placeholder="Anteckningar om skiftet"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Skapar..." : "Skapa skift"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};