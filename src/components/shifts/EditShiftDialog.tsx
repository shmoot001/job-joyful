import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useShifts } from "@/hooks/useShifts";
import { useJobs } from "@/hooks/useJobs";

interface EditShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: any;
}

export const EditShiftDialog = ({ open, onOpenChange, shift }: EditShiftDialogProps) => {
  const { updateShift, isUpdating } = useShifts();
  const { jobs } = useJobs();
  const [formData, setFormData] = useState({
    job_id: "",
    date: "",
    start_time: "",
    end_time: "",
    hours: "",
    notes: "",
  });

  useEffect(() => {
    if (shift) {
      setFormData({
        job_id: shift.job_id || "",
        date: shift.date || "",
        start_time: shift.start_time || "",
        end_time: shift.end_time || "",
        hours: shift.hours ? shift.hours.toString() : "",
        notes: shift.notes || "",
      });
    }
  }, [shift]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updates: any = {
      id: shift.id,
      job_id: formData.job_id,
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      notes: formData.notes || undefined,
    };

    if (formData.hours) {
      updates.hours = parseFloat(formData.hours);
    }

    updateShift(updates);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Redigera skift</DialogTitle>
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
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end_time">Sluttid</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hours">Timmar (valfritt)</Label>
            <Input
              id="hours"
              type="number"
              step="0.5"
              min="0"
              placeholder="Antal timmar"
              value={formData.hours}
              onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
            />
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
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Uppdaterar..." : "Uppdatera skift"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};