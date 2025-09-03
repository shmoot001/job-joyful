import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import SubscribeCalendarDialog from "@/components/calendar/SubscribeCalendarDialog";
import ManageSubscriptionsDialog from "@/components/calendar/ManageSubscriptionsDialog";
import { EditShiftDialog } from "@/components/shifts/EditShiftDialog";
import { AddShiftDialog } from "@/components/shifts/AddShiftDialog";
import { AddTaskDialog } from "@/components/tasks/AddTaskDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useShifts } from "@/hooks/useShifts";
import { useTasks } from "@/hooks/useTasks";
import { useJobs } from "@/hooks/useJobs";
import { useToast } from "@/hooks/use-toast";
import { parseICalData, ICalEvent } from "@/utils/icalParser";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [externalEvents, setExternalEvents] = useState<ICalEvent[]>([]);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [shiftActionDialogOpen, setShiftActionDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addShiftDialogOpen, setAddShiftDialogOpen] = useState(false);
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [newItemDialogOpen, setNewItemDialogOpen] = useState(false);
  const { shifts, isLoading: shiftsLoading, createShift, deleteShift } = useShifts();
  const { tasks, isLoading: tasksLoading } = useTasks();
  const { jobs, createJob } = useJobs();
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

  const handleShiftClick = (shift: any) => {
    setSelectedShift(shift);
    setShiftActionDialogOpen(true);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setNewItemDialogOpen(true);
  };

  const handleEditShift = () => {
    setShiftActionDialogOpen(false);
    setEditDialogOpen(true);
  };

  const handleAddNewShift = () => {
    setShiftActionDialogOpen(false);
    const shiftDate = new Date(selectedShift.date);
    setSelectedDate(shiftDate);
    setAddShiftDialogOpen(true);
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold">Kalender</h1>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex space-x-2">
              <SubscribeCalendarDialog onSubscribe={handleCalendarSubscription} />
              <ManageSubscriptionsDialog onSubscriptionsChange={handleSubscriptionsChange} deleteShift={deleteShift} shifts={shifts} />
            </div>
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
                const dayExternalEvents = getExternalEventsForDate(day);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={day.toISOString()}
                    className={`h-20 sm:h-32 border border-border/50 p-0.5 sm:p-1 cursor-pointer hover:bg-muted/30 transition-colors ${
                      !isSameMonth(day, currentDate) ? "bg-muted/30" : ""
                    } ${isToday ? "bg-primary/10" : ""}`}
                    onClick={() => dayTasks.length === 0 && dayShifts.length === 0 && handleDayClick(day)}
                  >
                    <div className={`text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${isToday ? "text-primary" : ""}`}>
                      {format(day, "d")}
                    </div>
                    
                    <div className="space-y-0.5 sm:space-y-1">
                      {/* Shifts - only show first 2 on mobile */}
                      {dayShifts.slice(0, 2).map(shift => (
                        <div
                          key={shift.id}
                          className="text-[10px] sm:text-xs p-0.5 sm:p-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ 
                            backgroundColor: `${getJobColor(shift.job_id)}20`,
                            borderLeft: `2px sm:3px solid ${getJobColor(shift.job_id)}`
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShiftClick(shift);
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

                      {/* External Calendar Events - only show first 1 on mobile */}
                      {dayExternalEvents.slice(0, 1).map(event => (
                        <div
                          key={event.id}
                          className="text-[10px] sm:text-xs p-0.5 sm:p-1 rounded truncate cursor-pointer hover:opacity-80 bg-blue-100 text-blue-800"
                          title={`${event.title} (${event.calendarName})`}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="text-[9px] sm:text-xs opacity-75 hidden sm:block">{event.calendarName}</div>
                        </div>
                      ))}

                      {/* Show count if there are more items */}
                      {(dayShifts.length > 2 || dayTasks.length > 1 || dayExternalEvents.length > 1) && (
                        <div className="text-[9px] sm:text-xs text-muted-foreground text-center sm:hidden">
                          +{(dayShifts.length > 2 ? dayShifts.length - 2 : 0) + (dayTasks.length > 1 ? dayTasks.length - 1 : 0) + (dayExternalEvents.length > 1 ? dayExternalEvents.length - 1 : 0)} mer
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
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-100 rounded-sm"></div>
            <span className="text-xs sm:text-sm">Externa kalendrar</span>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      
      {/* Shift Action Dialog */}
      <Dialog open={shiftActionDialogOpen} onOpenChange={setShiftActionDialogOpen}>
        <DialogContent className="bg-background border border-border">
          <DialogHeader>
            <DialogTitle>Vad vill du göra?</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-3">
            <Button onClick={handleEditShift} variant="default">
              Redigera skift
            </Button>
            <Button onClick={handleAddNewShift} variant="outline">
              Lägg till nytt skift
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
      
      <EditShiftDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        shift={selectedShift}
      />
      
      <AddShiftDialog
        open={addShiftDialogOpen}
        onOpenChange={setAddShiftDialogOpen}
      />
      
      <AddTaskDialog
        open={addTaskDialogOpen}
        onOpenChange={setAddTaskDialogOpen}
      />
    </div>
  );
};

export default Calendar;