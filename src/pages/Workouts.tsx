import { useState } from "react";
import { format, startOfWeek, addDays, isToday } from "date-fns";
import { sv } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkouts } from "@/hooks/useWorkouts";

const Workouts = () => {
  const { 
    workoutWeeks, 
    isLoadingWeeks, 
    createWorkoutWeek, 
    isCreatingWeek,
    updateWorkoutDay,
    isUpdatingDay,
    deleteWorkoutWeek,
    isDeletingWeek
  } = useWorkouts();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isNewWeekDialogOpen, setIsNewWeekDialogOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<{
    weekId: string;
    dayOfWeek: number;
    date: Date;
    bodyPart?: string;
    exercises?: string;
    notes?: string;
    isRestDay?: boolean;
  } | null>(null);

  const handleCreateWeek = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday start
    createWorkoutWeek(weekStart);
    setIsNewWeekDialogOpen(false);
  };

  const handleUpdateDay = (dayData: {
    bodyPart: string;
    exercises: string;
    notes: string;
    isRestDay: boolean;
  }) => {
    if (!editingDay) return;

    updateWorkoutDay({
      workoutWeekId: editingDay.weekId,
      dayOfWeek: editingDay.dayOfWeek,
      date: editingDay.date,
      bodyPart: dayData.bodyPart,
      exercises: dayData.exercises,
      notes: dayData.notes,
      isRestDay: dayData.isRestDay,
    });
    setEditingDay(null);
  };

  const getDayOfWeekName = (dayOfWeek: number) => {
    const days = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];
    return days[dayOfWeek];
  };

  const getDayData = (workoutWeek: any, dayOfWeek: number) => {
    return workoutWeek.workout_days?.find((day: any) => day.day_of_week === dayOfWeek);
  };

  if (isLoadingWeeks) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Laddar träningsprogram...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <Dumbbell className="h-6 w-6 sm:h-8 sm:w-8" />
              Träningsprogram
            </h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
              Planera dina träningsveckor och följ dina framsteg
            </p>
          </div>
          
          <Dialog open={isNewWeekDialogOpen} onOpenChange={setIsNewWeekDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                <span className="sm:inline">Ny träningsvecka</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Skapa ny träningsvecka</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Välj veckostart (måndag)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP", { locale: sv }) : "Välj datum"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button 
                  onClick={handleCreateWeek} 
                  disabled={isCreatingWeek}
                  className="w-full"
                >
                  {isCreatingWeek ? "Skapar..." : "Skapa vecka"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {workoutWeeks && workoutWeeks.length > 0 ? (
          <div className="space-y-6">
            {workoutWeeks.map((week) => {
              const weekStart = new Date(week.week_start_date);
              const weekDays = Array.from({ length: 7 }, (_, i) => {
                const day = addDays(weekStart, i);
                return {
                  date: day,
                  dayOfWeek: day.getDay(),
                  dayName: getDayOfWeekName(day.getDay()),
                };
              });

              return (
                <Card key={week.id} className="w-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">
                        Vecka {week.week_number}, {week.year}
                      </CardTitle>
                      <p className="text-muted-foreground">
                        {format(weekStart, "d MMMM", { locale: sv })} - {format(addDays(weekStart, 6), "d MMMM yyyy", { locale: sv })}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteWorkoutWeek(week.id)}
                      disabled={isDeletingWeek}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                   <CardContent className="p-3 sm:p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4">
                      {weekDays.map((day) => {
                        const dayData = getDayData(week, day.dayOfWeek);
                        const isCurrentDay = isToday(day.date);
                        
                        return (
                          <Card 
                            key={day.dayOfWeek} 
                            className={cn(
                              "cursor-pointer transition-colors hover:bg-muted/50 min-h-[100px] sm:min-h-[120px]",
                              isCurrentDay && "ring-2 ring-primary"
                            )}
                            onClick={() => setEditingDay({
                              weekId: week.id,
                              dayOfWeek: day.dayOfWeek,
                              date: day.date,
                              bodyPart: dayData?.body_part || "",
                              exercises: dayData?.exercises || "",
                              notes: dayData?.notes || "",
                              isRestDay: dayData?.is_rest_day || false,
                            })}
                          >
                            <CardContent className="p-2 sm:p-4">
                              <div className="text-center h-full flex flex-col justify-between">
                                <div>
                                  <h4 className={cn(
                                    "font-medium mb-1 sm:mb-2 text-xs sm:text-sm",
                                    isCurrentDay && "text-primary"
                                  )}>
                                    {day.dayName.substring(0, 3)}
                                  </h4>
                                  <p className="text-xs text-muted-foreground mb-1 sm:mb-2">
                                    {format(day.date, "d", { locale: sv })}
                                  </p>
                                </div>
                                
                                <div className="flex-1 flex items-center justify-center">
                                  {dayData?.is_rest_day ? (
                                    <div className="bg-muted rounded p-1 sm:p-2 w-full">
                                      <p className="text-xs font-medium">Vila</p>
                                    </div>
                                  ) : dayData?.body_part || dayData?.exercises ? (
                                    <div className="space-y-1 w-full">
                                      {dayData.body_part && (
                                        <p className="text-xs sm:text-sm font-medium text-primary line-clamp-2">
                                          {dayData.body_part}
                                        </p>
                                      )}
                                      {dayData.exercises && (
                                        <p className="text-xs text-muted-foreground line-clamp-2 hidden sm:block">
                                          {dayData.exercises}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-muted-foreground">
                                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 mx-auto" />
                                      <p className="text-xs mt-1">Planera</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Dumbbell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">Inga träningsveckor än</h3>
            <p className="text-muted-foreground mb-4">
              Skapa din första träningsvecka för att komma igång
            </p>
          </div>
        )}

        {/* Edit Day Dialog */}
        <WorkoutDayDialog
          isOpen={!!editingDay}
          onClose={() => setEditingDay(null)}
          onSave={handleUpdateDay}
          dayData={editingDay}
          isUpdating={isUpdatingDay}
        />
      </div>
  );
};

// Workout Day Dialog Component
const WorkoutDayDialog = ({
  isOpen,
  onClose,
  onSave,
  dayData,
  isUpdating,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { bodyPart: string; exercises: string; notes: string; isRestDay: boolean }) => void;
  dayData: any;
  isUpdating: boolean;
}) => {
  const [bodyPart, setBodyPart] = useState(dayData?.bodyPart || "");
  const [exercises, setExercises] = useState(dayData?.exercises || "");
  const [notes, setNotes] = useState(dayData?.notes || "");
  const [isRestDay, setIsRestDay] = useState(dayData?.isRestDay || false);

  const handleSave = () => {
    onSave({ bodyPart, exercises, notes, isRestDay });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto m-4">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            {dayData ? `${getDayOfWeekName(dayData.dayOfWeek)} - ${format(dayData.date, "d MMM", { locale: sv })}` : "Planera träningsdag"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="restDay"
              checked={isRestDay}
              onChange={(e) => setIsRestDay(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="restDay">Vilodag</Label>
          </div>

          {!isRestDay && (
            <>
              <div className="space-y-2">
                <Label htmlFor="bodyPart">Muskelgrupp/Kroppspart</Label>
                <Input
                  id="bodyPart"
                  placeholder="t.ex. Bröst & Triceps, Ben, Rygg & Biceps"
                  value={bodyPart}
                  onChange={(e) => setBodyPart(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exercises">Övningar</Label>
                <Textarea
                  id="exercises"
                  placeholder="Skriv dina planerade övningar här..."
                  value={exercises}
                  onChange={(e) => setExercises(e.target.value)}
                  rows={4}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Anteckningar</Label>
            <Textarea
              id="notes"
              placeholder="Eventuella anteckningar..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? "Sparar..." : "Spara"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper function for day names
const getDayOfWeekName = (dayOfWeek: number) => {
  const days = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];
  return days[dayOfWeek];
};

export default Workouts;