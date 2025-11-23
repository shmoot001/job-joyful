import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTasks } from "@/hooks/useTasks";
import { useCategories } from "@/hooks/useCategories";

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: string;
  selectedDate?: Date | null;
}


export const AddTaskDialog = ({ open, onOpenChange, defaultCategory, selectedDate }: AddTaskDialogProps) => {
  const { createTask, isCreating } = useTasks();
  const { categories } = useCategories();
  
  const getDefaultDeadline = () => {
    if (selectedDate) {
      return selectedDate.toISOString().split('T')[0];
    }
    return "";
  };
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: defaultCategory || "Privat",
    deadline: getDefaultDeadline(),
  });

  useEffect(() => {
    if (selectedDate && open) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, deadline: dateString }));
    }
  }, [selectedDate, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createTask({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      deadline: formData.deadline || undefined,
    });
    
    setFormData({
      title: "",
      description: "",
      category: defaultCategory || "Privat",
      deadline: "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Lägg till ny uppgift</DialogTitle>
          <DialogDescription>
            Skapa en ny uppgift med kategori och deadline
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="t.ex. Handla mat"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Beskrivning (valfritt)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Lägg till detaljer..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Välj kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (valfritt)</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Skapar..." : "Skapa uppgift"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};