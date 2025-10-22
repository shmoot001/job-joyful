import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, GripVertical, Bell, X } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import Header from "@/components/Header";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

const DailyTodo = () => {
  const { tasks, isLoading, toggleTaskComplete, createTask } = useTasks();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Filter tasks for today or tasks without deadlines
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks?.filter(task => {
    if (!task.deadline) return true; // Include tasks without deadlines
    return task.deadline.split('T')[0] === today;
  }) || [];

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    setIsAddingTask(true);
    try {
      await createTask({
        title: newTaskTitle,
        category: "Allmänt",
        deadline: new Date().toISOString(),
      });
      setNewTaskTitle("");
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">Laddar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Card className="bg-card shadow-lg">
          {/* Header */}
          <div className="border-b border-border px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-foreground">Daglig Att Göra</h1>
            <Bell className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Task List */}
          <div className="px-6 py-2">
            {todayTasks.map((task) => (
              <div 
                key={task.id}
                className="flex items-center gap-3 py-3 border-b border-border last:border-0 group hover:bg-accent/50 px-2 -mx-2 rounded transition-colors"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => toggleTaskComplete(task.id, !task.completed)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {task.title}
                </span>
              </div>
            ))}

            {/* Add Task Input */}
            <div className="flex items-center gap-3 py-3">
              <Plus className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Listobjekt"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isAddingTask}
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-sm placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border px-6 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Redigerades {format(new Date(), 'HH:mm')}
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.history.back()}
              className="text-sm"
            >
              Stäng
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DailyTodo;
