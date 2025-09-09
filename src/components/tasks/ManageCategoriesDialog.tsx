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
import { useCategories } from "@/hooks/useCategories";
import { toast } from "@/hooks/use-toast";

interface ManageCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const colorOptions = [
  { value: '#3B82F6', name: 'Blå' },
  { value: '#10B981', name: 'Grön' },
  { value: '#F59E0B', name: 'Gul' },
  { value: '#EF4444', name: 'Röd' },
  { value: '#8B5CF6', name: 'Lila' },
  { value: '#F97316', name: 'Orange' },
  { value: '#06B6D4', name: 'Cyan' },
  { value: '#84CC16', name: 'Lime' },
];

export const ManageCategoriesDialog = ({ open, onOpenChange }: ManageCategoriesDialogProps) => {
  const { tasks, updateTask } = useTasks();
  const { categories, createCategory, updateCategory, deleteCategory, isCreating, isUpdating, isDeleting } = useCategories();
  
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategoryColor, setEditCategoryColor] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [moveToCategory, setMoveToCategory] = useState<string>("");

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    
    createCategory({
      name: newCategoryName.trim(),
      color: newCategoryColor,
    });
    
    setNewCategoryName("");
    setNewCategoryColor('#3B82F6');
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category.id);
    setEditCategoryName(category.name);
    setEditCategoryColor(category.color);
  };

  const handleSaveEdit = () => {
    if (!editCategoryName.trim() || !editingCategory) return;
    
    updateCategory({
      id: editingCategory,
      name: editCategoryName.trim(),
      color: editCategoryColor,
    });
    
    setEditingCategory(null);
    setEditCategoryName("");
    setEditCategoryColor("");
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    const tasksInCategory = tasks?.filter(task => task.category === categoryName) || [];
    
    if (tasksInCategory.length > 0 && moveToCategory) {
      // Move tasks to another category
      try {
        for (const task of tasksInCategory) {
          await updateTask({ id: task.id, category: moveToCategory });
        }
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
    
    deleteCategory(categoryId);
    setDeleteConfirm(null);
    setMoveToCategory("");
  };

  const getCategoryTaskCount = (categoryName: string) => {
    return tasks?.filter(task => task.category === categoryName).length || 0;
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
              <div className="space-y-4">
                <div>
                  <Label>Kategorinamn</Label>
                  <Input
                    placeholder="t.ex. Gym, Projekt"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                </div>
                <div>
                  <Label>Färg</Label>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: newCategoryColor }}
                    />
                    <Select value={newCategoryColor} onValueChange={setNewCategoryColor}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: color.value }}
                              />
                              <span>{color.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  onClick={handleAddCategory} 
                  disabled={!newCategoryName.trim() || isCreating}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isCreating ? "Skapar..." : "Skapa kategori"}
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
                {categories?.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      {editingCategory === category.id ? (
                        <div className="flex items-center space-x-2">
                          <Input
                            value={editCategoryName}
                            onChange={(e) => setEditCategoryName(e.target.value)}
                            className="w-40"
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                          />
                          <Select value={editCategoryColor} onValueChange={setEditCategoryColor}>
                            <SelectTrigger className="w-20">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: editCategoryColor }}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {colorOptions.map((color) => (
                                <SelectItem key={color.value} value={color.value}>
                                  <div className="flex items-center space-x-2">
                                    <div
                                      className="w-4 h-4 rounded-full"
                                      style={{ backgroundColor: color.value }}
                                    />
                                    <span>{color.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" onClick={handleSaveEdit} disabled={isUpdating}>
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
                          <span className="font-medium">{category.name}</span>
                          <Badge variant="secondary">
                            {getCategoryTaskCount(category.name)} uppgifter
                          </Badge>
                        </>
                      )}
                    </div>
                    
                    {editingCategory !== category.id && (
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
                          onClick={() => setDeleteConfirm(category.id)}
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
          {deleteConfirm && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-lg text-destructive">
                  Ta bort kategori
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const categoryToDelete = categories?.find(c => c.id === deleteConfirm);
                  const taskCount = getCategoryTaskCount(categoryToDelete?.name || "");
                  
                  return (
                    <>
                      {taskCount > 0 && (
                        <div>
                          <Label>Denna kategori har {taskCount} uppgifter. Flytta dem till:</Label>
                          <Select value={moveToCategory} onValueChange={setMoveToCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="Välj kategori" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories
                                ?.filter(cat => cat.id !== deleteConfirm)
                                .map((category) => (
                                  <SelectItem key={category.id} value={category.name}>
                                    <div className="flex items-center space-x-2">
                                      <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: category.color }}
                                      />
                                      <span>{category.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="destructive" 
                          onClick={() => handleDeleteCategory(deleteConfirm, categoryToDelete?.name || "")}
                          disabled={isDeleting || (taskCount > 0 && !moveToCategory)}
                        >
                          {isDeleting ? "Tar bort..." : "Ta bort kategori"}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setDeleteConfirm(null);
                            setMoveToCategory("");
                          }}
                        >
                          Avbryt
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
