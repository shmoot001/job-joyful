import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import Header from "@/components/Header";
import SubscribeCalendarDialog from "@/components/calendar/SubscribeCalendarDialog";
import ManageSubscriptionsDialog from "@/components/calendar/ManageSubscriptionsDialog";
import { ShiftDetailsDialog } from "@/components/shifts/ShiftDetailsDialog";
import { AddShiftDialog } from "@/components/shifts/AddShiftDialog";
import { TaskDetailsDialog } from "@/components/tasks/TaskDetailsDialog";
import { AddTaskDialog } from "@/components/tasks/AddTaskDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useShifts } from "@/hooks/useShifts";
import { useTasks } from "@/hooks/useTasks";
import { useJobs } from "@/hooks/useJobs";
import { useCategories } from "@/hooks/useCategories";
import { useToast } from "@/hooks/use-toast";
import { parseICalData, ICalEvent } from "@/utils/icalParser";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [externalEvents, setExternalEvents] = useState<ICalEvent[]>([]);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [shiftDetailsDialogOpen, setShiftDetailsDialogOpen] = useState(false);
  const [taskDetailsDialogOpen, setTaskDetailsDialogOpen] = useState(false);
  const [addShiftDialogOpen, setAddShiftDialogOpen] = useState(false);
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [newItemDialogOpen, setNewItemDialogOpen] = useState(false);
  const { shifts, isLoading: shiftsLoading, createShift, deleteShift } = useShifts();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { jobs, createJob } = useJobs();
  const { categories } = useCategories();
  const { toast } = useToast();

  // Load external calendar events on component mount
  useEffect(() => {
    loadExternalEvents();
  }, []);

  const loadExternalEvents = () => {
    try {
      const subscriptions = JSON.parse(localStorage.getItem('calendarSubscriptions') || '[]');
      const allEvents: ICalEvent[] = [];
      
      subscriptions.forEach((subscription: any) => {
        const events = parseICalData(subscription.data, subscription.name);
        allEvents.push(...events);
      });
      
      setExternalEvents(allEvents);
    } catch (error) {
      console.error('Error loading external events:', error);
    }
  };

  const handleSubscriptionsChange = () => {
    loadExternalEvents();
  };

  const handleCalendarSubscription = async (url: string, name: string) => {
    try {
      // Fetch the iCal data
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch calendar');
      }
      
      const icalData = await response.text();
      
      // Parse the iCal events
      const events = parseICalData(icalData, name);
      
      // First, find or create a job for this calendar
      let calendarJob = jobs?.find(job => job.name === `Kalender: ${name}`);
      
      if (!calendarJob) {
        // Create a job for this calendar
        const jobData = {
          name: `Kalender: ${name}`,
          description: `Automatiskt skapat jobb för kalenderprenumeration: ${name}`,
          hourly_rate: 0,
          break_time: 0,
          ob_rate: 0,
          color: '#8B5CF6'
        };
        
        createJob(jobData);
        // We'll use the first available job for now, as the new job will be available after refresh
        calendarJob = jobs?.[0];
      }
      
      // Save events as shifts to the database
      const shiftPromises = events.map(async (event) => {
        // Skip all-day events or events without proper time info
        if (!event.start || !event.end || event.start.toDateString() === event.end.toDateString() && 
            event.start.getHours() === 0 && event.end.getHours() === 0) {
          return;
        }
        
        // Calculate hours
        const startTime = `${event.start.getHours().toString().padStart(2, '0')}:${event.start.getMinutes().toString().padStart(2, '0')}:00`;
        const endTime = `${event.end.getHours().toString().padStart(2, '0')}:${event.end.getMinutes().toString().padStart(2, '0')}:00`;
        const hours = (event.end.getTime() - event.start.getTime()) / (1000 * 60 * 60);
        
        // Find the calendar job or use any available job
        const jobToUse = jobs?.find(job => job.name === `Kalender: ${name}`) || calendarJob || jobs?.[0];
        
        if (!jobToUse) {
          console.warn('No job available for calendar shift:', event.title);
          return;
        }
        
        const shiftData = {
          job_id: jobToUse.id,
          date: format(event.start, 'yyyy-MM-dd'),
          start_time: startTime,
          end_time: endTime,
          hours: hours,
          notes: `${event.title} (från ${name})`
        };
        
        try {
          createShift(shiftData);
        } catch (error) {
          console.error('Error creating shift for event:', event.title, error);
        }
      });
      
      await Promise.all(shiftPromises.filter(Boolean));
      
      // Store in localStorage for display purposes
      const existingSubscriptions = JSON.parse(localStorage.getItem('calendarSubscriptions') || '[]');
      const newSubscription = {
        id: Date.now().toString(),
        name,
        url,
        data: icalData,
        createdAt: new Date().toISOString()
      };
      
      existingSubscriptions.push(newSubscription);
      localStorage.setItem('calendarSubscriptions', JSON.stringify(existingSubscriptions));
      
      toast({
        title: "Kalender tillagd",
        description: `Kalendern "${name}" har lagts till och ${events.length} händelser har importerats som skift`,
      });
      
      // Reload events to show new calendar
      loadExternalEvents();
    } catch (error) {
      console.error('Error subscribing to calendar:', error);
      toast({
        title: "Fel",
        description: "Kunde inte lägga till kalendern. Kontrollera URL:en och försök igen.",
        variant: "destructive",
      });
    }
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

  const getExternalEventsForDate = (date: Date) => {
    return externalEvents.filter(event => isSameDay(event.start, date));
  };

  const getJobColor = (jobId: string) => {
    const job = jobs?.find(j => j.id === jobId);
    return job?.color || "#3B82F6";
  };

  const getCategoryColor = (categoryName: string) => {
    const category = categories?.find(c => c.name === categoryName);
    return category?.color || "#F59E0B";
  };

  const handleShiftClick = (shift: any) => {
    setSelectedShift(shift);
    setShiftDetailsDialogOpen(true);
  };

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setTaskDetailsDialogOpen(true);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setNewItemDialogOpen(true);
  };

  const handleAddShift = () => {
    setNewItemDialogOpen(false);
    setAddShiftDialogOpen(true);
  };

  const handleAddTask = () => {
    setNewItemDialogOpen(false);
    setAddTaskDialogOpen(true);
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
        <div className="flex flex-col space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-3xl font-bold">Kalender</h1>
            <div className="flex sm:hidden space-x-1">
              <SubscribeCalendarDialog onSubscribe={handleCalendarSubscription} />
              <ManageSubscriptionsDialog onSubscriptionsChange={handleSubscriptionsChange} deleteShift={deleteShift} shifts={shifts} />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center justify-center sm:justify-start space-x-2">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-base sm:text-xl font-semibold min-w-[140px] sm:min-w-[200px] text-center">
                {format(currentDate, "MMMM yyyy", { locale: sv })}
              </h2>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="hidden sm:flex space-x-2">
              <SubscribeCalendarDialog onSubscribe={handleCalendarSubscription} />
              <ManageSubscriptionsDialog onSubscriptionsChange={handleSubscriptionsChange} deleteShift={deleteShift} shifts={shifts} />
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-1 sm:p-6">
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-border sm:gap-1">
              {/* Day Headers */}
              {["M", "T", "O", "T", "F", "L", "S"].map((day, index) => (
                <div key={day + index} className="p-1 sm:p-2 text-center text-[10px] sm:text-sm font-semibold text-muted-foreground bg-background">
                  <span className="hidden sm:inline">
                    {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"][index]}
                  </span>
                  <span className="sm:hidden">{day}</span>
                </div>
              ))}
              
              {/* Empty cells for days before month start */}
              {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, index) => (
                <div key={`empty-${index}`} className="h-16 sm:h-32 bg-muted/20"></div>
              ))}

              {/* Month Days */}
              {monthDays.map(day => {
                const dayShifts = getShiftsForDate(day);
                const dayTasks = getTasksForDate(day);
                const dayExternalEvents = getExternalEventsForDate(day);
                const isToday = isSameDay(day, new Date());
                const hasItems = dayShifts.length > 0 || dayTasks.length > 0 || dayExternalEvents.length > 0;
                const totalItems = dayShifts.length + dayTasks.length + dayExternalEvents.length;
                const hasOverflow = dayShifts.length > 2 || dayTasks.length > 1 || dayExternalEvents.length > 1;

                return (
                  <div
                    key={day.toISOString()}
                    className={`h-16 sm:h-32 p-0.5 sm:p-1 relative bg-background cursor-pointer transition-colors hover:bg-muted/50 ${
                      !isSameMonth(day, currentDate) ? "bg-muted/30 opacity-50" : ""
                    } ${isToday ? "bg-primary/5 ring-1 ring-primary/20" : ""}`}
                    onClick={() => handleDayClick(day)}
                  >
                    <div className={`text-[11px] sm:text-sm font-medium mb-0.5 sm:mb-1 text-center sm:text-left ${isToday ? "text-primary font-bold" : ""}`}>
                      {format(day, "d")}
                    </div>
                    
                    <div className="space-y-0.5 overflow-hidden">
                      {/* Shifts - show 1 on mobile, 3 on desktop */}
                      {dayShifts.slice(0, 1).map(shift => (
                        <div
                          key={shift.id}
                          className="text-[9px] sm:text-xs p-0.5 sm:p-1 rounded-sm truncate cursor-pointer hover:opacity-80 transition-opacity sm:block"
                          style={{ 
                            backgroundColor: getJobColor(shift.job_id),
                            color: 'white'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShiftClick(shift);
                          }}
                          title={`${shift.jobs?.name} - ${shift.start_time}-${shift.end_time}`}
                        >
                          <div className="font-medium truncate leading-tight">{shift.jobs?.name}</div>
                        </div>
                      ))}
                      {dayShifts.slice(1, 3).map(shift => (
                        <div
                          key={shift.id}
                          className="hidden sm:block text-xs p-1 rounded-sm truncate cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ 
                            backgroundColor: getJobColor(shift.job_id),
                            color: 'white'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShiftClick(shift);
                          }}
                          title={`${shift.jobs?.name} - ${shift.start_time}-${shift.end_time}`}
                        >
                          <div className="font-medium truncate">{shift.jobs?.name}</div>
                          <div className="opacity-90 text-[10px]">
                            {shift.start_time.slice(0, 5)}-{shift.end_time.slice(0, 5)}
                          </div>
                        </div>
                      ))}

                      {/* Tasks - show dots on mobile, 1-2 on desktop */}
                      {dayTasks.slice(0, 1).map(task => (
                        <div
                          key={task.id}
                          className="text-[9px] sm:text-xs p-0.5 sm:p-1 rounded-sm truncate cursor-pointer hover:opacity-80 text-white"
                          style={{
                            backgroundColor: task.completed ? '#6B7280' : getCategoryColor(task.category),
                            opacity: task.completed ? 0.6 : 1
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskClick(task);
                          }}
                          title={task.title}
                        >
                          <div className={`font-medium truncate leading-tight ${task.completed ? 'line-through' : ''}`}>
                            {task.title}
                          </div>
                        </div>
                      ))}
                      {dayTasks.slice(1, 2).map(task => (
                        <div
                          key={task.id}
                          className="hidden sm:block text-xs p-1 rounded-sm truncate cursor-pointer hover:opacity-80 text-white"
                          style={{
                            backgroundColor: task.completed ? '#6B7280' : getCategoryColor(task.category),
                            opacity: task.completed ? 0.6 : 1
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskClick(task);
                          }}
                          title={task.title}
                        >
                          <div className={`font-medium truncate ${task.completed ? 'line-through' : ''}`}>
                            {task.title}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Overflow indicator with detailed view */}
                    {totalItems > 2 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute bottom-0 left-0 right-0 h-4 sm:h-5 w-full p-0 text-[8px] sm:text-xs bg-background/90 hover:bg-background/95 border-t"
                            onClick={(e) => e.stopPropagation()}
                          >
                            +{totalItems - 2}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start">
                          <div className="p-3 border-b">
                            <h4 className="font-semibold text-sm">
                              {format(day, "d MMMM yyyy", { locale: sv })}
                            </h4>
                          </div>
                          <ScrollArea className="h-64">
                            <div className="p-3 space-y-3">
                              {/* All Shifts */}
                              {dayShifts.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Clock className="h-4 w-4 text-primary" />
                                    <h5 className="font-medium text-sm">Skift ({dayShifts.length})</h5>
                                  </div>
                                  <div className="space-y-1">
                                    {dayShifts.map(shift => (
                                      <div
                                        key={shift.id}
                                        className="text-xs p-2 rounded cursor-pointer hover:opacity-80 transition-opacity text-white"
                                        style={{ 
                                          backgroundColor: getJobColor(shift.job_id),
                                          borderLeft: `3px solid ${getJobColor(shift.job_id)}`
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleShiftClick(shift);
                                        }}
                                      >
                                        <div className="font-medium">{shift.jobs?.name}</div>
                                        <div className="text-xs opacity-90">
                                          {shift.start_time.slice(0, 5)}-{shift.end_time.slice(0, 5)}
                                        </div>
                                        {shift.notes && (
                                          <div className="text-xs opacity-80 truncate">{shift.notes}</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* All Tasks */}
                              {dayTasks.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="h-4 w-4 text-orange-600" />
                                    <h5 className="font-medium text-sm">Uppgifter ({dayTasks.length})</h5>
                                  </div>
                                   <div className="space-y-1">
                                     {dayTasks.map(task => (
                                       <div
                                         key={task.id}
                                         className="text-xs p-2 rounded cursor-pointer hover:opacity-80 text-white"
                                         style={{
                                           backgroundColor: task.completed ? '#6B7280' : getCategoryColor(task.category),
                                           opacity: task.completed ? 0.6 : 1
                                         }}
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           handleTaskClick(task);
                                         }}
                                       >
                                         <div className={`font-medium ${task.completed ? 'line-through' : ''}`}>{task.title}</div>
                                         <div className="text-xs opacity-90">{task.category}</div>
                                         {task.description && (
                                           <div className="text-xs opacity-80 mt-1">{task.description}</div>
                                         )}
                                       </div>
                                     ))}
                                   </div>
                                </div>
                              )}

                              {/* All External Events */}
                              {dayExternalEvents.length > 0 && (
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <CalendarIcon className="h-4 w-4 text-blue-600" />
                                    <h5 className="font-medium text-sm">Externa kalendrar ({dayExternalEvents.length})</h5>
                                  </div>
                                  <div className="space-y-1">
                                    {dayExternalEvents.map(event => (
                                      <div
                                        key={event.id}
                                        className="text-xs p-2 rounded cursor-pointer hover:opacity-80 bg-blue-100 text-blue-800"
                                      >
                                        <div className="font-medium">{event.title}</div>
                                        <div className="text-xs opacity-75">{event.calendarName}</div>
                                        {event.start && event.end && (
                                          <div className="text-xs opacity-80">
                                            {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                          <div className="p-3 border-t">
                            <Button 
                              onClick={() => handleDayClick(day)} 
                              size="sm" 
                              className="w-full"
                              variant="outline"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Lägg till ny
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}

                    {/* Click handler for empty days */}
                    {!hasItems && (
                      <div 
                        className="absolute inset-0 cursor-pointer hover:bg-muted/30 transition-colors rounded"
                        onClick={() => handleDayClick(day)}
                      />
                    )}
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
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-100 rounded-sm"></div>
            <span className="text-xs sm:text-sm">Externa kalendrar</span>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      
      {/* Shift Details Dialog */}
      <ShiftDetailsDialog
        open={shiftDetailsDialogOpen}
        onOpenChange={setShiftDetailsDialogOpen}
        shift={selectedShift}
      />

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        open={taskDetailsDialogOpen}
        onOpenChange={setTaskDetailsDialogOpen}
        task={selectedTask}
      />

      {/* New Item Dialog */}
      <Dialog open={newItemDialogOpen} onOpenChange={setNewItemDialogOpen}>
        <DialogContent className="bg-background border border-border">
          <DialogHeader>
            <DialogTitle>Vad vill du skapa?</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-3">
            <Button onClick={handleAddShift} variant="default">
              Lägg till skift
            </Button>
            <Button onClick={handleAddTask} variant="outline">
              Lägg till uppgift
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <AddShiftDialog 
        open={addShiftDialogOpen} 
        onOpenChange={setAddShiftDialogOpen}
        selectedDate={selectedDate}
      />
      
      <AddTaskDialog
        open={addTaskDialogOpen}
        onOpenChange={setAddTaskDialogOpen}
      />
    </div>
  );
};

export default Calendar;