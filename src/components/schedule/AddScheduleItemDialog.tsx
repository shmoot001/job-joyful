import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTasks } from "@/hooks/useTasks";
import { useShifts } from "@/hooks/useShifts";
import { useJobs } from "@/hooks/useJobs";
import { useCategories } from "@/hooks/useCategories";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddScheduleItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  selectedTime: string | null;
}

const AddScheduleItemDialog = ({
  open,
  onOpenChange,
  selectedDate,
  selectedTime,
}: AddScheduleItemDialogProps) => {
  const [activeTab, setActiveTab] = useState<"task" | "shift">("task");

  // Task state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskCategory, setTaskCategory] = useState("");
  const [taskDeadline, setTaskDeadline] = useState<Date | undefined>(selectedDate);

  // Shift state
  const [shiftJobId, setShiftJobId] = useState("");
  const [shiftDate, setShiftDate] = useState<Date | undefined>(selectedDate);
  const [shiftStartTime, setShiftStartTime] = useState(selectedTime || "09:00");
  const [shiftEndTime, setShiftEndTime] = useState("");
  const [shiftNotes, setShiftNotes] = useState("");

  const { createTask, isCreating: isCreatingTask } = useTasks();
  const { createShift, isCreating: isCreatingShift } = useShifts();
  const { jobs } = useJobs();
  const { categories } = useCategories();

  const resetForm = () => {
    setTaskTitle("");
    setTaskDescription("");
    setTaskCategory("");
    setTaskDeadline(selectedDate);
    setShiftJobId("");
    setShiftDate(selectedDate);
    setShiftStartTime(selectedTime || "09:00");
    setShiftEndTime("");
    setShiftNotes("");
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) return;

    await createTask({
      title: taskTitle,
      description: taskDescription,
      category: taskCategory || "Allmänt",
      deadline: taskDeadline?.toISOString(),
    });

    resetForm();
    onOpenChange(false);
  };

  const handleCreateShift = async () => {
    if (!shiftJobId || !shiftDate || !shiftStartTime || !shiftEndTime) return;

    await createShift({
      job_id: shiftJobId,
      date: format(shiftDate, "yyyy-MM-dd"),
      start_time: shiftStartTime,
      end_time: shiftEndTime,
      notes: shiftNotes,
    });

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Lägg till aktivitet</DialogTitle>
          <DialogDescription>
            Skapa en ny uppgift eller ett skift för {format(selectedDate, "d MMMM yyyy")}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "task" | "shift")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="task">Uppgift</TabsTrigger>
            <TabsTrigger value="shift">Skift</TabsTrigger>
          </TabsList>

          <TabsContent value="task" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Titel</Label>
              <Input
                id="task-title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Uppgiftens titel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Beskrivning</Label>
              <Textarea
                id="task-description"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Beskrivning (valfritt)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-category">Kategori</Label>
              <Select value={taskCategory} onValueChange={setTaskCategory}>
                <SelectTrigger id="task-category">
                  <SelectValue placeholder="Välj kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !taskDeadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {taskDeadline ? format(taskDeadline, "PPP") : "Välj datum"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={taskDeadline}
                    onSelect={setTaskDeadline}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button
              onClick={handleCreateTask}
              disabled={isCreatingTask || !taskTitle.trim()}
              className="w-full"
            >
              {isCreatingTask ? "Skapar..." : "Skapa uppgift"}
            </Button>
          </TabsContent>

          <TabsContent value="shift" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="shift-job">Jobb</Label>
              <Select value={shiftJobId} onValueChange={setShiftJobId}>
                <SelectTrigger id="shift-job">
                  <SelectValue placeholder="Välj jobb" />
                </SelectTrigger>
                <SelectContent>
                  {jobs?.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Datum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !shiftDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {shiftDate ? format(shiftDate, "PPP") : "Välj datum"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={shiftDate}
                    onSelect={setShiftDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shift-start">Starttid</Label>
                <Input
                  id="shift-start"
                  type="time"
                  value={shiftStartTime}
                  onChange={(e) => setShiftStartTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shift-end">Sluttid</Label>
                <Input
                  id="shift-end"
                  type="time"
                  value={shiftEndTime}
                  onChange={(e) => setShiftEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift-notes">Anteckningar</Label>
              <Textarea
                id="shift-notes"
                value={shiftNotes}
                onChange={(e) => setShiftNotes(e.target.value)}
                placeholder="Anteckningar (valfritt)"
                rows={3}
              />
            </div>

            <Button
              onClick={handleCreateShift}
              disabled={isCreatingShift || !shiftJobId || !shiftStartTime || !shiftEndTime}
              className="w-full"
            >
              {isCreatingShift ? "Skapar..." : "Skapa skift"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddScheduleItemDialog;
