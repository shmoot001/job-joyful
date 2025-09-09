import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Save, X, Folder } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { toast } from "@/hooks/use-toast";

interface ManageCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManageCategoriesDialog = ({ open, onOpenChange }: ManageCategoriesDialogProps) => {
  const { tasks, updateTask, createTask } = useTasks();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [deleteCategory, setDeleteCategory] = useState<string | null>(null);
  const [moveToCategory, setMoveToCategory] = useState<string>("");
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  // Get unique categories from tasks and stored categories
  const taskCategories = Array.from(new Set(tasks?.map(task => task.category).filter(Boolean))) || [];
  
  // Combine task categories with manually added categories
  const allCategories = Array.from(new Set([...taskCategories, ...availableCategories]));
  
  // Add default categories if they don't exist
  const defaultCategories = ["Privat", "Arbete", "Skola"];
  defaultCategories.forEach(cat => {
    if (!allCategories.includes(cat)) {
      allCategories.push(cat);
    }
  });

  const categories = allCategories.sort();

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    const trimmedName = newCategoryName.trim();
    if (categories.includes(trimmedName)) {
      toast({
        title: "Kategori finns redan",
        description: "En kategori med detta namn finns redan",
        variant: "destructive",
      });
      return;
    }

    // Add to available categories list
    setAvailableCategories(prev => [...prev, trimmedName]);
    
    toast({
      title: "Kategori skapad",
      description: `Kategorin "${trimmedName}" har lagts till`,
    });
    
    setNewCategoryName("");
  };

  const handleEditCategory = (oldName: string) => {
    setEditingCategory(oldName);
    setEditCategoryName(oldName);
  };

  const handleSaveEdit = async () => {
    if (!editCategoryName.trim() || !editingCategory) return;
    
    if (categories.includes(editCategoryName.trim()) && editCategoryName.trim() !== editingCategory) {
      toast({
        title: "Kategori finns redan",
        description: "En kategori med detta namn finns redan",
        variant: "destructive",
      });
      return;
    }

    // Update all tasks with the old category name to the new name
    const tasksToUpdate = tasks?.filter(task => task.category === editingCategory) || [];
    
    try {
      for (const task of tasksToUpdate) {
        await updateTask({ id: task.id, category: editCategoryName.trim() });
      }
      
      // Update available categories if this was a manually added category
      setAvailableCategories(prev => 
        prev.map(cat => cat === editingCategory ? editCategoryName.trim() : cat)
      );
      
      toast({
        title: "Kategori uppdaterad",
        description: `Kategorin har ändrats till "${editCategoryName.trim()}"`,
      });
      
      setEditingCategory(null);
      setEditCategoryName("");
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera kategorin",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategory) return;
    
    const tasksInCategory = tasks?.filter(task => task.category === deleteCategory) || [];
    
    if (tasksInCategory.length > 0 && moveToCategory) {
      // Move tasks to another category
      try {
        for (const task of tasksInCategory) {
          await updateTask({ id: task.id, category: moveToCategory });
        }
        
        toast({
          title: "Kategori borttagen",
          description: `Uppgifter flyttade till "${moveToCategory}"`,
        });
      } catch (error) {
        toast({
          title: "Fel",
          description: "Kunde inte flytta uppgifter",
          variant: "destructive",
        });
        return;
      }
    } else if (tasksInCategory.length > 0) {
      toast({
        title: "Välj en kategori",
        description: "Du måste välja vart uppgifterna ska flyttas",
        variant: "destructive",
      });
      return;
    }
    
    // Remove from available categories if it was manually added
    setAvailableCategories(prev => prev.filter(cat => cat !== deleteCategory));
    
    toast({
      title: "Kategori borttagen",
      description: `Kategorin "${deleteCategory}" har tagits bort`,
    });
    
    setDeleteCategory(null);
    setMoveToCategory("");
  };

  const getCategoryTaskCount = (category: string) => {
    return tasks?.filter(task => task.category === category).length || 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Hantera Kategorier</DialogTitle>
          <DialogDescription>
            Lägg till, redigera eller ta bort kategorier för dina uppgifter
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Add New Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Lägg till ny kategori</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Input
                  placeholder="Kategorinamn (t.ex. Gym, Projekt)"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Existing Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Befintliga kategorier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categories.map((category) => (
                  <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Folder className="h-5 w-5 text-primary" />
                      {editingCategory === category ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={editCategoryName}
                            onChange={(e) => setEditCategoryName(e.target.value)}
                            className="w-40"
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                          />
                          <Button size="sm" onClick={handleSaveEdit}>
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setEditingCategory(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium">{category}</span>
                          <Badge variant="secondary">
                            {getCategoryTaskCount(category)} uppgifter
                          </Badge>
                        </>
                      )}
                    </div>
                    
                    {editingCategory !== category && (
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => setDeleteCategory(category)}
                          disabled={getCategoryTaskCount(category) > 0 && categories.length <= 1}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Delete Category Confirmation */}
          {deleteCategory && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-lg text-destructive">
                  Ta bort kategori: {deleteCategory}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {getCategoryTaskCount(deleteCategory) > 0 && (
                  <div>
                    <Label>Denna kategori har {getCategoryTaskCount(deleteCategory)} uppgifter. Flytta dem till:</Label>
                    <Select value={moveToCategory} onValueChange={setMoveToCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Välj kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter(cat => cat !== deleteCategory)
                          .map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteCategory}
                    disabled={getCategoryTaskCount(deleteCategory) > 0 && !moveToCategory}
                  >
                    Ta bort kategori
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setDeleteCategory(null);
                      setMoveToCategory("");
                    }}
                  >
                    Avbryt
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
