import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, CheckSquare, Calendar, Edit, Trash2, ArrowLeft, Folder, FolderOpen, Settings } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useCategories } from "@/hooks/useCategories";
import { AddTaskDialog } from "@/components/tasks/AddTaskDialog";
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog";
import { DeleteTaskDialog } from "@/components/tasks/DeleteTaskDialog";
import { ManageCategoriesDialog } from "@/components/tasks/ManageCategoriesDialog";
import Header from "@/components/Header";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

const Tasks = () => {
  const { tasks, isLoading, toggleTaskComplete } = useTasks();
  const { categories } = useCategories();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);

  const handleEdit = (task: any) => {
    setSelectedTask(task);
    setEditDialogOpen(true);
  };

  const handleDelete = (task: any) => {
    setSelectedTask(task);
    setDeleteDialogOpen(true);
  };

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    await toggleTaskComplete(taskId, !completed);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Laddar uppgifter...</div>
        </div>
      </div>
    );
  }

  // Filter tasks by selected category
  const filteredTasks = selectedCategory 
    ? tasks?.filter(task => task.category === selectedCategory) || []
    : tasks || [];

  const pendingTasks = filteredTasks.filter(task => !task.completed);
  const completedTasks = filteredTasks.filter(task => task.completed);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedCategory ? (
          // Category Selection View
          <>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Uppgift Kartor</h1>
                <p className="text-muted-foreground mt-2">Välj en kategori för att hantera dina uppgifter</p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setManageCategoriesOpen(true)}
                className="flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Hantera kategorier</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories?.map((category) => {
                const categoryTasks = tasks?.filter(task => task.category === category.name) || [];
                const pendingCount = categoryTasks.filter(task => !task.completed).length;
                const completedCount = categoryTasks.filter(task => task.completed).length;
                
                return (
                  <Card 
                    key={category.id} 
                    className="hover:shadow-lg transition-all cursor-pointer hover:scale-105"
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <Folder 
                            className="h-6 w-6" 
                            style={{ color: category.color }}
                          />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <CardDescription>
                            {pendingCount} pågående • {completedCount} slutförda
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Totalt: {categoryTasks.length} uppgifter</span>
                        <span>{pendingCount > 0 ? `${pendingCount} att göra` : "Alla klara!"}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        ) : (
          // Category Detail View
          <>
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Tillbaka</span>
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2">
                    <FolderOpen className="h-8 w-8 text-primary" />
                    <span>{selectedCategory}</span>
                  </h1>
                  <p className="text-muted-foreground mt-2">
                    {pendingTasks.length} pågående • {completedTasks.length} slutförda
                  </p>
                </div>
              </div>
              <Button onClick={() => setAddDialogOpen(true)} className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Lägg till uppgift</span>
              </Button>
            </div>

            {selectedCategory && filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Inga uppgifter i {selectedCategory}</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Lägg till din första uppgift i denna kategori
                  </p>
                  <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Lägg till uppgift
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* Pending Tasks */}
                {pendingTasks.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Pågående ({pendingTasks.length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pendingTasks.map((task) => (
                        <Card key={task.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex items-start space-x-3">
                              <Checkbox
                                checked={task.completed}
                                onCheckedChange={() => handleToggleComplete(task.id, task.completed)}
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <CardTitle className="text-base">{task.title}</CardTitle>
                                  <div className="flex space-x-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleEdit(task)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleDelete(task)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                {task.description && (
                                  <CardDescription className="mt-1">
                                    {task.description}
                                  </CardDescription>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">{task.category}</Badge>
                              {task.deadline && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {format(new Date(task.deadline), 'dd MMM', { locale: sv })}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Tasks */}
                {completedTasks.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
                      Slutförda ({completedTasks.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {completedTasks.map((task) => (
                        <Card key={task.id} className="opacity-60 hover:opacity-80 transition-opacity">
                          <CardHeader>
                            <div className="flex items-start space-x-3">
                              <Checkbox
                                checked={task.completed}
                                onCheckedChange={() => handleToggleComplete(task.id, task.completed)}
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                  <CardTitle className="text-base line-through">{task.title}</CardTitle>
                                  <div className="flex space-x-1">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleEdit(task)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => handleDelete(task)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                {task.description && (
                                  <CardDescription className="mt-1 line-through">
                                    {task.description}
                                  </CardDescription>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">{task.category}</Badge>
                              {task.completed_at && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <CheckSquare className="h-3 w-3 mr-1" />
                                  {format(new Date(task.completed_at), 'dd MMM', { locale: sv })}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <AddTaskDialog 
          open={addDialogOpen} 
          onOpenChange={setAddDialogOpen}
          defaultCategory={selectedCategory || undefined}
        />
        <EditTaskDialog 
          open={editDialogOpen} 
          onOpenChange={setEditDialogOpen}
          task={selectedTask}
        />
        <DeleteTaskDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          task={selectedTask}
        />
        <ManageCategoriesDialog
          open={manageCategoriesOpen}
          onOpenChange={setManageCategoriesOpen}
        />
      </div>
    </div>
  );
};

export default Tasks;