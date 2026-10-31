import { useMemo, useState } from "react";
import { format, startOfWeek, addDays, isToday, parseISO } from "date-fns";
import { sv } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CalendarIcon,
  Plus,
  Trash2,
  Dumbbell,
  Copy,
  Play,
  CheckCircle2,
  CalendarDays,
  TrendingUp,
  Scale,
  MoreHorizontal,
  BookmarkPlus,
  LayoutTemplate,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useWorkouts } from "@/hooks/useWorkouts";
import { parseDayPlan, planProgress, type PlannedExercise } from "@/data/exercises";
import { ExerciseImage } from "@/components/workouts/ExerciseImage";
import { WorkoutSessionDialog } from "@/components/workouts/WorkoutSessionDialog";
import { WorkoutProgress } from "@/components/workouts/WorkoutProgress";
import { buildExerciseHistory } from "@/data/workoutHistory";
import { WorkoutDayDialog, type EditingDay, type SaveDayData } from "@/components/workouts/WorkoutDayDialog";
import type { PastDay } from "@/components/workouts/RepeatSessionDialog";
import { ApplyProgramDialog, ProgramWeekPreview, SaveProgramDialog } from "@/components/workouts/ProgramDialogs";
import { WeeklySummary } from "@/components/workouts/WeeklySummary";
import { BodyTracking } from "@/components/workouts/BodyTracking";
import { computeAllWeekStats } from "@/data/weeklyStats";
import { useWorkoutPrograms, type ProgramDay } from "@/hooks/useWorkoutPrograms";

const Workouts = () => {
  const { 
    workoutWeeks, 
    isLoadingWeeks, 
    createWorkoutWeek, 
    isCreatingWeek,
    updateWorkoutDay,
    isUpdatingDay,
    deleteWorkoutWeek,
    isDeletingWeek,
    duplicateWorkoutWeek,
    isDuplicatingWeek,
    saveDayProgress,
  } = useWorkouts();
  const {
    programs,
    saveProgram,
    isSavingProgram,
    deleteProgram,
    applyProgram,
    isApplyingProgram,
    copyDay,
  } = useWorkoutPrograms();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isNewWeekDialogOpen, setIsNewWeekDialogOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<EditingDay | null>(null);
  const [session, setSession] = useState<{
    dayId: string;
    date: string;
    title: string;
    exercises: PlannedExercise[];
  } | null>(null);

  const [newWeekProgramId, setNewWeekProgramId] = useState<string | null>(null);
  const [savingProgramDays, setSavingProgramDays] = useState<ProgramDay[] | null>(null);
  const [applyingWeek, setApplyingWeek] = useState<{ start: Date; hasPlan: boolean } | null>(null);

  const weekStats = useMemo(() => computeAllWeekStats(workoutWeeks ?? []), [workoutWeeks]);

  // Every planned day with exercises, newest first – for "repeat an earlier session"
  const pastDays = useMemo<PastDay[]>(
    () =>
      (workoutWeeks ?? [])
        .flatMap((w) => w.workout_days ?? [])
        .filter((d) => !d.is_rest_day)
        .map((d) => ({ date: d.date, bodyPart: d.body_part, exercises: parseDayPlan(d.exercises).plan.exercises }))
        .filter((d) => d.exercises.length > 0)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [workoutWeeks]
  );

  const history = useMemo(
    () => buildExerciseHistory(workoutWeeks?.flatMap((w) => w.workout_days ?? []) ?? []),
    [workoutWeeks]
  );

  const startSession = (dayId: string, date: Date, bodyPart: string | null, exercises: PlannedExercise[]) =>
    setSession({
      dayId,
      date: format(date, "yyyy-MM-dd"),
      title: `${getDayOfWeekName(date.getDay())} ${format(date, "d MMM", { locale: sv })}${bodyPart ? ` – ${bodyPart}` : ""}`,
      exercises,
    });

  const handleCreateWeek = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday start
    const program = programs.find((p) => p.id === newWeekProgramId);
    if (program) applyProgram({ program, date: weekStart });
    else createWorkoutWeek(weekStart);
    setIsNewWeekDialogOpen(false);
    setNewWeekProgramId(null);
  };

  const handleUpdateDay = (dayData: SaveDayData) => {
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

  const getDayData = (workoutWeek: NonNullable<typeof workoutWeeks>[number], dayOfWeek: number) => {
    return workoutWeek.workout_days?.find((day) => day.day_of_week === dayOfWeek);
  };

  // Today's planned workout, if any
  const todayDay = workoutWeeks
    ?.flatMap((w) => w.workout_days ?? [])
    .find((d) => d.date === format(new Date(), "yyyy-MM-dd") && !d.is_rest_day);
  const todayPlan = todayDay ? parseDayPlan(todayDay.exercises).plan.exercises : [];
  const todayProgress = planProgress(todayPlan);

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
                {programs.length > 0 && (
                  <div className="space-y-2">
                    <Label>Starta från program (valfritt)</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={newWeekProgramId === null ? "default" : "outline"}
                        className="rounded-full"
                        onClick={() => setNewWeekProgramId(null)}
                      >
                        Tom vecka
                      </Button>
                      {programs.map((p) => (
                        <Button
                          key={p.id}
                          type="button"
                          size="sm"
                          variant={newWeekProgramId === p.id ? "default" : "outline"}
                          className="rounded-full"
                          onClick={() => setNewWeekProgramId(p.id)}
                        >
                          {p.name}
                        </Button>
                      ))}
                    </div>
                    {newWeekProgramId && (
                      <ProgramWeekPreview days={programs.find((p) => p.id === newWeekProgramId)?.days ?? []} />
                    )}
                  </div>
                )}
                <Button 
                  onClick={handleCreateWeek} 
                  disabled={isCreatingWeek || isApplyingProgram}
                  className="w-full"
                >
                  {isCreatingWeek || isApplyingProgram ? "Skapar..." : "Skapa vecka"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="plan" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
            <TabsTrigger value="plan" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Planering
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Framsteg
            </TabsTrigger>
            <TabsTrigger value="body" className="gap-2">
              <Scale className="h-4 w-4" />
              Kropp
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plan" className="mt-0">
          {todayDay && todayPlan.length > 0 && (
            <Card className="mb-6 border-primary/40 bg-primary/5">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex -space-x-3 shrink-0">
                  {todayPlan.slice(0, 4).map((p, i) => (
                    <ExerciseImage key={i} exerciseId={p.exerciseId} className="h-12 w-12 rounded-full border-2 border-background" />
                  ))}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-primary font-medium">Dagens pass</p>
                  <p className="font-semibold truncate">{todayDay.body_part || "Träning"}</p>
                  <p className="text-sm text-muted-foreground">
                    {todayPlan.length} övningar · {todayProgress.done}/{todayProgress.total} set klara
                  </p>
                </div>
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  variant={todayProgress.complete ? "outline" : "default"}
                  onClick={() => startSession(todayDay.id, parseISO(todayDay.date), todayDay.body_part, todayPlan)}
                >
                  {todayProgress.complete ? (
                    <><CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />Klart – visa</>
                  ) : (
                    <><Play className="h-4 w-4 mr-2" />{todayProgress.done > 0 ? "Fortsätt passet" : "Starta passet"}</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {workoutWeeks && workoutWeeks.length > 0 ? (
            <div className="space-y-6">
              {workoutWeeks.map((week) => {
                const weekStart = parseISO(week.week_start_date);
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" aria-label="Veckoåtgärder">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              setApplyingWeek({
                                start: weekStart,
                                hasPlan: (week.workout_days ?? []).some((d) => d.is_rest_day || d.exercises || d.body_part),
                              })
                            }
                          >
                            <LayoutTemplate className="h-4 w-4 mr-2" />
                            Använd program
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!(week.workout_days ?? []).length}
                            onClick={() =>
                              setSavingProgramDays(
                                (week.workout_days ?? []).map((d) => ({
                                  day_of_week: d.day_of_week,
                                  body_part: d.body_part,
                                  exercises: d.exercises,
                                  notes: d.notes,
                                  is_rest_day: !!d.is_rest_day,
                                }))
                              )
                            }
                          >
                            <BookmarkPlus className="h-4 w-4 mr-2" />
                            Spara som program
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateWorkoutWeek(week.id)} disabled={isDuplicatingWeek}>
                            <Copy className="h-4 w-4 mr-2" />
                            Kopiera till nästa vecka
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            disabled={isDeletingWeek}
                            onClick={() => {
                              if (confirm("Ta bort hela träningsveckan?")) deleteWorkoutWeek(week.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Ta bort vecka
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                     <CardContent className="p-3 sm:p-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-4">
                        {weekDays.map((day) => {
                          const dayData = getDayData(week, day.dayOfWeek);
                          const isCurrentDay = isToday(day.date);
                          const { plan, legacyText } = parseDayPlan(dayData?.exercises);
                          const progress = planProgress(plan.exercises);
                        
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
                              role="button"
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
                                      <div className="space-y-1.5 w-full">
                                        {dayData.body_part && (
                                          <p className="text-xs sm:text-sm font-medium text-primary line-clamp-2">
                                            {dayData.body_part}
                                          </p>
                                        )}
                                        {plan.exercises.length > 0 && (
                                          <>
                                            <div className="flex justify-center -space-x-2">
                                              {plan.exercises.slice(0, 3).map((p, i) => (
                                                <ExerciseImage
                                                  key={i}
                                                  exerciseId={p.exerciseId}
                                                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border-2 border-background"
                                                />
                                              ))}
                                              {plan.exercises.length > 3 && (
                                                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium">
                                                  +{plan.exercises.length - 3}
                                                </div>
                                              )}
                                            </div>
                                            {progress.complete ? (
                                              <p className="text-[11px] font-medium text-green-600 flex items-center justify-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Klart
                                              </p>
                                            ) : (
                                              <p className="text-[11px] text-muted-foreground">
                                                {progress.done > 0
                                                  ? `${progress.done}/${progress.total} set`
                                                  : `${plan.exercises.length} övn · ${progress.total} set`}
                                              </p>
                                            )}
                                            {dayData && !dayData.is_rest_day && (
                                              <Button
                                                size="sm"
                                                variant={progress.complete ? "ghost" : "secondary"}
                                                className="h-7 w-full text-xs"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  startSession(dayData.id, day.date, dayData.body_part, plan.exercises);
                                                }}
                                              >
                                                <Play className="h-3 w-3 mr-1" />
                                                {progress.complete ? "Visa" : progress.done > 0 ? "Fortsätt" : "Starta"}
                                              </Button>
                                            )}
                                          </>
                                        )}
                                        {legacyText && (
                                          <p className="text-xs text-muted-foreground line-clamp-2 hidden sm:block">
                                            {legacyText}
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
          </TabsContent>

          <TabsContent value="progress" className="mt-0 space-y-6">
            <WeeklySummary weeks={weekStats} />
            <WorkoutProgress history={history} />
          </TabsContent>

          <TabsContent value="body" className="mt-0">
            <BodyTracking />
          </TabsContent>
        </Tabs>

        {/* Edit Day Dialog */}
        {session && (
          <WorkoutSessionDialog
            key={session.dayId}
            title={session.title}
            date={session.date}
            history={history}
            exercises={session.exercises}
            onSave={(exercises) => saveDayProgress({ dayId: session.dayId, exercises })}
            onClose={() => setSession(null)}
          />
        )}

        {editingDay && (
          <WorkoutDayDialog
            key={`${editingDay.weekId}-${editingDay.dayOfWeek}`}
            day={editingDay}
            onClose={() => setEditingDay(null)}
            onSave={handleUpdateDay}
            isUpdating={isUpdatingDay}
            pastDays={pastDays}
            onCopyTo={(data, targetDate) =>
              copyDay({
                targetDate,
                content: {
                  bodyPart: data.bodyPart,
                  exercises: data.exercises,
                  notes: data.notes,
                  isRestDay: data.isRestDay,
                },
              })
            }
          />
        )}

        {savingProgramDays && (
          <SaveProgramDialog
            days={savingProgramDays}
            isSaving={isSavingProgram}
            onClose={() => setSavingProgramDays(null)}
            onSave={(name) => saveProgram({ name, days: savingProgramDays })}
          />
        )}

        {applyingWeek && (
          <ApplyProgramDialog
            weekStart={applyingWeek.start}
            weekHasPlan={applyingWeek.hasPlan}
            programs={programs}
            onApply={(program) => applyProgram({ program, date: applyingWeek.start })}
            onDelete={deleteProgram}
            onClose={() => setApplyingWeek(null)}
          />
        )}
      </div>
  );
};

export default Workouts;
