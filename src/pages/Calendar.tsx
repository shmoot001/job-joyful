import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import SubscribeCalendarDialog from "@/components/calendar/SubscribeCalendarDialog";
import { useShifts } from "@/hooks/useShifts";
import { useTasks } from "@/hooks/useTasks";
import { useJobs } from "@/hooks/useJobs";
import { useToast } from "@/hooks/use-toast";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { shifts, isLoading: shiftsLoading } = useShifts();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { jobs } = useJobs();
  const { toast } = useToast();

  const handleCalendarSubscription = (url: string, name: string) => {
    // For now, just show a success message
    // In a real implementation, you would:
    // 1. Store the subscription details
    // 2. Fetch and parse the iCal data
    // 3. Merge events into the calendar view
    console.log('Calendar subscription:', { url, name });
    
    toast({
      title: "Funktion under utveckling",
      description: "Kalenderprenumeration kommer att implementeras snart",
    });
  };

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
      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Kalender</h1>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <SubscribeCalendarDialog onSubscribe={handleCalendarSubscription} />
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg sm:text-xl font-semibold min-w-[160px] sm:min-w-[200px] text-center">
                {format(currentDate, "MMMM yyyy", { locale: sv })}
              </h2>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="sm:hidden">
            <CardTitle className="text-center">
              {format(currentDate, "MMMM yyyy", { locale: sv })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-6">
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px sm:gap-1">
              {/* Day Headers */}
              {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map(day => (
                <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-semibold text-muted-foreground border-b">
                  {day}
                </div>
              ))}
              
              {/* Empty cells for days before month start */}
              {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, index) => (
                <div key={`empty-${index}`} className="h-20 sm:h-32 border border-border/50 bg-muted/20"></div>
              ))}

              {/* Month Days */}
              {monthDays.map(day => {
                const dayShifts = getShiftsForDate(day);
                const dayTasks = getTasksForDate(day);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={day.toISOString()}
                    className={`h-20 sm:h-32 border border-border/50 p-0.5 sm:p-1 ${
                      !isSameMonth(day, currentDate) ? "bg-muted/30" : ""
                    } ${isToday ? "bg-primary/10" : ""}`}
                  >
                    <div className={`text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${isToday ? "text-primary" : ""}`}>
                      {format(day, "d")}
                    </div>
                    
                    <div className="space-y-0.5 sm:space-y-1">
                      {/* Shifts - only show first 2 on mobile */}
                      {dayShifts.slice(0, 2).map(shift => (
                        <div
                          key={shift.id}
                          className="text-[10px] sm:text-xs p-0.5 sm:p-1 rounded truncate cursor-pointer hover:opacity-80"
                          style={{ 
                            backgroundColor: `${getJobColor(shift.job_id)}20`,
                            borderLeft: `2px sm:3px solid ${getJobColor(shift.job_id)}`
                          }}
                          title={`${shift.jobs?.name} - ${shift.start_time}-${shift.end_time}`}
                        >
                          <div className="font-medium truncate">{shift.jobs?.name}</div>
                          <div className="text-muted-foreground hidden sm:block">
                            {shift.start_time.slice(0, 5)}-{shift.end_time.slice(0, 5)}
                          </div>
                        </div>
                      ))}

                      {/* Tasks - only show first 1 on mobile */}
                      {dayTasks.slice(0, 1).map(task => (
                        <div
                          key={task.id}
                          className={`text-[10px] sm:text-xs p-0.5 sm:p-1 rounded truncate cursor-pointer hover:opacity-80 ${
                            task.completed 
                              ? "bg-green-100 text-green-800 line-through" 
                              : "bg-orange-100 text-orange-800"
                          }`}
                          title={task.title}
                        >
                          <div className="font-medium truncate">{task.title}</div>
                          <div className="text-[9px] sm:text-xs opacity-75 hidden sm:block">{task.category}</div>
                        </div>
                      ))}

                      {/* Show count if there are more items */}
                      {(dayShifts.length > 2 || dayTasks.length > 1) && (
                        <div className="text-[9px] sm:text-xs text-muted-foreground text-center sm:hidden">
                          +{(dayShifts.length > 2 ? dayShifts.length - 2 : 0) + (dayTasks.length > 1 ? dayTasks.length - 1 : 0)} mer
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-4 justify-center sm:justify-start">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-primary/20 border-l-2 sm:border-l-4 border-primary rounded-sm"></div>
            <span className="text-xs sm:text-sm">Skift</span>
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-orange-100 rounded-sm"></div>
            <span className="text-xs sm:text-sm">Väntande uppgifter</span>
          </div>
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-100 rounded-sm"></div>
            <span className="text-xs sm:text-sm">Slutförda uppgifter</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;