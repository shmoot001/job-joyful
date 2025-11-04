import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useTasks } from "@/hooks/useTasks";
import { useShifts } from "@/hooks/useShifts";
import Header from "@/components/Header";
import { format, addDays, subDays, startOfDay, isSameDay } from "date-fns";
import { sv } from "date-fns/locale";
import AddScheduleItemDialog from "@/components/schedule/AddScheduleItemDialog";

const DaySchedule = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { shifts, isLoading: shiftsLoading } = useShifts();

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dateString = format(selectedDate, "yyyy-MM-dd");

  // Filter tasks and shifts for selected date
  const dayTasks = tasks?.filter(task => 
    task.deadline && isSameDay(new Date(task.deadline), selectedDate)
  ) || [];

  const dayShifts = shifts?.filter(shift => 
    isSameDay(new Date(shift.date), selectedDate)
  ) || [];

  const handleTimeSlotClick = (hour: number) => {
    setSelectedTime(`${hour.toString().padStart(2, '0')}:00`);
    setDialogOpen(true);
  };

  const handlePreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const getItemsForHour = (hour: number) => {
    const items: Array<{ type: 'task' | 'shift', data: any }> = [];

    // Add shifts that overlap with this hour
    dayShifts.forEach(shift => {
      const startHour = parseInt(shift.start_time.split(':')[0]);
      const endHour = parseInt(shift.end_time.split(':')[0]);
      
      if ((startHour <= hour && endHour > hour) || (startHour <= hour && endHour === 0)) {
        items.push({ type: 'shift', data: shift });
      }
    });

    return items;
  };

  if (tasksLoading || shiftsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">Laddar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Date Navigation */}
        <Card className="mb-6 p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousDay}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex flex-col items-center">
              <h2 className="text-2xl font-bold">
                {format(selectedDate, "d MMMM yyyy", { locale: sv })}
              </h2>
              <p className="text-sm text-muted-foreground">
                {format(selectedDate, "EEEE", { locale: sv })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleToday}
                size="sm"
              >
                Idag
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextDay}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Day Schedule */}
        <Card className="overflow-hidden">
          <div className="bg-muted/50 px-4 py-3 border-b">
            <h3 className="font-semibold">Dagschema</h3>
          </div>
          
          <div className="divide-y divide-border">
            {hours.map((hour) => {
              const items = getItemsForHour(hour);
              const timeString = `${hour.toString().padStart(2, '0')}:00`;
              
              return (
                <div
                  key={hour}
                  className="flex hover:bg-accent/50 transition-colors group"
                >
                  {/* Time column */}
                  <div className="w-20 flex-shrink-0 p-4 border-r border-border">
                    <span className="text-sm font-medium text-muted-foreground">
                      {timeString}
                    </span>
                  </div>

                  {/* Content column */}
                  <div className="flex-1 min-h-[60px] p-2 relative">
                    {items.length > 0 ? (
                      <div className="space-y-1">
                        {items.map((item, idx) => (
                          <div
                            key={`${item.type}-${idx}`}
                            className="p-2 rounded-lg text-sm"
                            style={{
                              backgroundColor: item.type === 'shift' 
                                ? `${item.data.jobs?.color}20`
                                : 'hsl(var(--primary) / 0.1)',
                              borderLeft: `3px solid ${item.type === 'shift' ? item.data.jobs?.color : 'hsl(var(--primary))'}`
                            }}
                          >
                            <div className="font-medium">
                              {item.type === 'shift' ? item.data.jobs?.name : 'Uppgift'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.type === 'shift' 
                                ? `${item.data.start_time.slice(0, 5)} - ${item.data.end_time.slice(0, 5)}`
                                : ''}
                            </div>
                            {item.type === 'shift' && item.data.notes && (
                              <div className="text-xs mt-1">{item.data.notes}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleTimeSlotClick(hour)}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Plus className="h-5 w-5 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Summary */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Card className="p-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Skift</h4>
            <p className="text-2xl font-bold">{dayShifts.length}</p>
          </Card>
          <Card className="p-4">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Uppgifter</h4>
            <p className="text-2xl font-bold">{dayTasks.length}</p>
          </Card>
        </div>
      </div>

      <AddScheduleItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
      />
    </div>
  );
};

export default DaySchedule;
