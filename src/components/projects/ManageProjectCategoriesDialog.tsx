import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";

interface ManageProjectCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLORS = [
  "#3B82F6", "#EF4444", "#22C55E", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];

export function ManageProjectCategoriesDialog({
  open,
  onOpenChange,
}: ManageProjectCategoriesDialogProps) {
  const { projectCategories, createCategory, deleteCategory } = useProjects();
  const [newName, setNewName] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  const handleAdd = () => {
    if (!newName.trim()) return;
    createCategory({ name: newName.trim(), color: selectedColor });
    setNewName("");
    setSelectedColor(COLORS[0]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Hantera projektkategorier</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new category */}
          <div className="space-y-3">
            <Input
              placeholder="Ny kategori..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Färg:</span>
              <div className="flex gap-1">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 ${
                      selectedColor === color ? "border-foreground" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </div>
            <Button size="sm" onClick={handleAdd} disabled={!newName.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Lägg till
            </Button>
          </div>

          {/* Existing categories */}
          <div className="space-y-2">
            {projectCategories?.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm">{category.name}</span>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => deleteCategory(category.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}

            {(!projectCategories || projectCategories.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Inga kategorier skapade ännu.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
