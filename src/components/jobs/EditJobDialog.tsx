import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useJobs } from "@/hooks/useJobs";

interface EditJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: any;
}

export const EditJobDialog = ({ open, onOpenChange, job }: EditJobDialogProps) => {
  const { updateJob, isUpdating } = useJobs();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    hourly_rate: "",
    break_time: "",
    ob_rate: "",
    color: "#3B82F6",
  });

  useEffect(() => {
    if (job) {
      setFormData({
        name: job.name || "",
        description: job.description || "",
        hourly_rate: job.hourly_rate?.toString() || "",
        break_time: job.break_time?.toString() || "0",
        ob_rate: job.ob_rate?.toString() || "0",
        color: job.color || "#3B82F6",
      });
    }
  }, [job]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!job?.id) return;
    
    updateJob({
      id: job.id,
      name: formData.name,
      description: formData.description,
      hourly_rate: parseFloat(formData.hourly_rate),
      break_time: parseInt(formData.break_time) || 0,
      ob_rate: parseFloat(formData.ob_rate) || 0,
      color: formData.color,
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Redigera jobb</DialogTitle>
          <DialogDescription>
            Uppdatera jobbinformation
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Jobbnamn</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="t.ex. Café Solen"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-description">Beskrivning (valfritt)</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Beskriv jobbet..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-hourly_rate">Timlön (kr)</Label>
            <Input
              id="edit-hourly_rate"
              type="number"
              step="0.01"
              value={formData.hourly_rate}
              onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
              placeholder="125.00"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-break_time">Rast (minuter)</Label>
            <Input
              id="edit-break_time"
              type="number"
              value={formData.break_time}
              onChange={(e) =>
                setFormData({ ...formData, break_time: e.target.value })
              }
              placeholder="0"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-ob_rate">OB-tillägg (kr/timme)</Label>
            <Input
              id="edit-ob_rate"
              type="number"
              step="0.01"
              value={formData.ob_rate}
              onChange={(e) =>
                setFormData({ ...formData, ob_rate: e.target.value })
              }
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Mån-Fre från 20:00, Lör från 16:00, hela Sön
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-color">Färg</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="edit-color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-16 h-10"
              />
              <Input
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="#3B82F6"
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Uppdaterar..." : "Uppdatera"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};