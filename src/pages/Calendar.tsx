import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import { useShifts } from "@/hooks/useShifts";
import { useTasks } from "@/hooks/useTasks";
import { useJobs } from "@/hooks/useJobs";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { shifts, isLoading: shiftsLoading } = useShifts();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { jobs } = useJobs();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getShiftsForDate = (date: Date) => {
    if (!shifts) return [];
    return shifts.filter(shift => isSameDay(parseISO(shift.date), date));
  };

  const getTasksForDate = (date: Date) => {
    if (!tasks) return [];
    return tasks.filter(task => task.deadline && isSameDay(parseISO(task.deadline), date));
  };

  const getJobColor = (jobId: string) => {
    const job = jobs?.find(j => j.id === jobId);
    return job?.color || "#3B82F6";
  };

  const isLoading = shiftsLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Laddar kalender...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold">Kalender</h1>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold min-w-[200px] text-center">
                {format(currentDate, "MMMM yyyy", { locale: sv })}
              </h2>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {format(currentDate, "MMMM yyyy", { locale: sv })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day Headers */}
              {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map(day => (
                <div key={day} className="p-2 text-center font-semibold text-muted-foreground border-b">
                  {day}
                </div>
              ))}
              
              {/* Empty cells for days before month start */}
              {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, index) => (
                <div key={`empty-${index}`} className="h-32 border border-border/50"></div>
              ))}

              {/* Month Days */}
              {monthDays.map(day => {
                const dayShifts = getShiftsForDate(day);
                const dayTasks = getTasksForDate(day);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={day.toISOString()}
                    className={`h-32 border border-border/50 p-1 ${
                      !isSameMonth(day, currentDate) ? "bg-muted/30" : ""
                    } ${isToday ? "bg-primary/10" : ""}`}
                  >
                    <div className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>
                      {format(day, "d")}
                    </div>
                    
                    <div className="space-y-1 mt-1">
                      {/* Shifts */}
                      {dayShifts.map(shift => (
                        <div
                          key={shift.id}
                          className="text-xs p-1 rounded truncate"
                          style={{ 
                            backgroundColor: `${getJobColor(shift.job_id)}20`,
                            borderLeft: `3px solid ${getJobColor(shift.job_id)}`
                          }}
                          title={`${shift.jobs?.name} - ${shift.start_time}-${shift.end_time}`}
                        >
                          <div className="font-medium truncate">{shift.jobs?.name}</div>
                          <div className="text-muted-foreground">
                            {shift.start_time.slice(0, 5)}-{shift.end_time.slice(0, 5)}
                          </div>
                        </div>
                      ))}

                      {/* Tasks */}
                      {dayTasks.map(task => (
                        <div
                          key={task.id}
                          className={`text-xs p-1 rounded truncate ${
                            task.completed 
                              ? "bg-green-100 text-green-800 line-through" 
                              : "bg-orange-100 text-orange-800"
                          }`}
                          title={task.title}
                        >
                          <div className="font-medium truncate">{task.title}</div>
                          <div className="text-xs opacity-75">{task.category}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary/20 border-l-4 border-primary rounded-sm"></div>
            <span className="text-sm">Skift</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-100 rounded-sm"></div>
            <span className="text-sm">Väntande uppgifter</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 rounded-sm"></div>
            <span className="text-sm">Slutförda uppgifter</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;