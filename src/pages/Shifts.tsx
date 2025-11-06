import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Clock, Edit, Trash2, Calendar, Copy, TrendingUp, DollarSign, CalendarDays } from "lucide-react";
import { useShifts } from "@/hooks/useShifts";
import { useJobs } from "@/hooks/useJobs";
import { AddShiftDialog } from "@/components/shifts/AddShiftDialog";
import { EditShiftDialog } from "@/components/shifts/EditShiftDialog";
import { DeleteShiftDialog } from "@/components/shifts/DeleteShiftDialog";
import { CopyShiftDialog } from "@/components/shifts/CopyShiftDialog";

import { parseISO, format, isToday, isTomorrow, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { sv } from "date-fns/locale";

const Shifts = () => {
  const { shifts, isLoading } = useShifts();
  const { jobs } = useJobs();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grouped">("grouped");

  const handleEdit = (shift: any) => {
    setSelectedShift(shift);
    setEditDialogOpen(true);
  };

  const handleDelete = (shift: any) => {
    setSelectedShift(shift);
    setDeleteDialogOpen(true);
  };

  const handleCopy = (shift: any) => {
    setSelectedShift(shift);
    setCopyDialogOpen(true);
  };

  // Calculate overview statistics
  const overviewStats = useMemo(() => {
    if (!shifts || !jobs) return {
      totalShifts: 0,
      upcomingShifts: 0,
      weekHours: 0,
      weekEarnings: 0,
      monthHours: 0,
      monthEarnings: 0
    };

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    let upcomingShifts = 0;
    let weekHours = 0;
    let weekEarnings = 0;
    let monthHours = 0;
    let monthEarnings = 0;

    shifts.forEach(shift => {
      const shiftDate = parseISO(shift.date);
      const job = jobs.find(j => j.id === shift.job_id);
      const hours = Number(shift.hours) || 0;
      const earnings = hours * (Number(job?.hourly_rate) || 0);

      if (shiftDate >= now) {
        upcomingShifts++;
      }

      if (isWithinInterval(shiftDate, { start: weekStart, end: weekEnd })) {
        weekHours += hours;
        weekEarnings += earnings;
      }

      if (isWithinInterval(shiftDate, { start: monthStart, end: monthEnd })) {
        monthHours += hours;
        monthEarnings += earnings;
      }
    });

    return {
      totalShifts: shifts.length,
      upcomingShifts,
      weekHours: Math.round(weekHours * 10) / 10,
      weekEarnings: Math.round(weekEarnings),
      monthHours: Math.round(monthHours * 10) / 10,
      monthEarnings: Math.round(monthEarnings)
    };
  }, [shifts, jobs]);

  const filteredShifts = useMemo(() => {
    if (!shifts) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return shifts.filter((shift) => {
      const shiftDate = new Date(shift.date);
      
      const jobMatch = jobFilter === "all" || shift.job_id === jobFilter;
      const timeMatch = timeFilter === "all" || 
        (timeFilter === "future" && shiftDate >= today) ||
        (timeFilter === "past" && shiftDate < today);
      
      return jobMatch && timeMatch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [shifts, jobFilter, timeFilter]);

  // Group shifts by date
  const groupedShifts = useMemo(() => {
    const groups: Record<string, typeof filteredShifts> = {};
    
    filteredShifts.forEach(shift => {
      const date = shift.date;
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(shift);
    });

    return Object.entries(groups).sort((a, b) => 
      new Date(b[0]).getTime() - new Date(a[0]).getTime()
    );
  }, [filteredShifts]);

  const calculateShiftEarnings = (shift: any) => {
    if (!shift.jobs?.hourly_rate || !shift.hours) return null;
    
    const job = shift.jobs;
    const baseEarnings = (job.hourly_rate * shift.hours);
    
    let obAmount = 0;
    if (job.ob_rate > 0 && shift.date && shift.start_time && shift.end_time) {
      const shiftDate = new Date(shift.date);
      const dayOfWeek = shiftDate.getDay();
      const [startHour] = shift.start_time.split(':').map(Number);
      const [endHour] = shift.end_time.split(':').map(Number);
      
      let obHours = 0;
      if (dayOfWeek === 0) {
        obHours = shift.hours;
      } else if (dayOfWeek >= 1 && dayOfWeek <= 5 && (startHour >= 20 || endHour >= 20)) {
        obHours = shift.hours;
      } else if (dayOfWeek === 6 && (startHour >= 16 || endHour >= 16)) {
        obHours = shift.hours;
      }
      obAmount = obHours * job.ob_rate;
    }
    
    const totalGross = baseEarnings + obAmount;
    const totalNet = totalGross * 0.67;
    
    return { totalNet, obAmount: obAmount * 0.67 };
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mina Skift</h1>
            <p className="text-muted-foreground mt-2">Hantera dina arbetspass</p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Lägg till skift</span>
          </Button>
        </div>

        {/* Overview Statistics */}
        {shifts && shifts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Kommande pass</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <CalendarDays className="h-6 w-6 text-primary" />
                  {overviewStats.upcomingShifts}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Timmar denna vecka</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <Clock className="h-6 w-6 text-chart-2" />
                  {overviewStats.weekHours}h
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Lön denna vecka</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-chart-3" />
                  {overviewStats.weekEarnings.toLocaleString('sv-SE')} kr
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Lön denna månad</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-chart-1" />
                  {overviewStats.monthEarnings.toLocaleString('sv-SE')} kr
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-6 animate-fade-in">
          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrera efter jobb" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla jobb</SelectItem>
              {jobs?.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: job.color }}
                    />
                    <span>{job.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrera efter tid" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla skift</SelectItem>
              <SelectItem value="future">Kommande skift</SelectItem>
              <SelectItem value="past">Tidigare skift</SelectItem>
            </SelectContent>
          </Select>

          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "grouped")} className="ml-auto">
            <TabsList>
              <TabsTrigger value="grouped">Grupperad</TabsTrigger>
              <TabsTrigger value="table">Tabell</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {filteredShifts?.length === 0 ? (
          <Card className="animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Inga skift ännu</h3>
              <p className="text-muted-foreground text-center mb-4">
                Kom igång genom att lägga till ditt första skift
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Lägg till skift
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === "grouped" ? (
          <div className="space-y-6 animate-fade-in">
            {groupedShifts.map(([date, dayShifts], groupIndex) => {
              const shiftDate = parseISO(date);
              const dateLabel = isToday(shiftDate) 
                ? "Idag" 
                : isTomorrow(shiftDate)
                ? "Imorgon"
                : format(shiftDate, 'EEEE d MMMM yyyy', { locale: sv });
              
              const dayTotal = dayShifts.reduce((sum, shift) => {
                const earnings = calculateShiftEarnings(shift);
                return sum + (earnings?.totalNet || 0);
              }, 0);

              const dayHours = dayShifts.reduce((sum, shift) => 
                sum + (Number(shift.hours) || 0), 0
              );

              return (
                <Card key={date} className="animate-fade-in" style={{ animationDelay: `${groupIndex * 50}ms` }}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl capitalize">{dateLabel}</CardTitle>
                        <CardDescription className="mt-1">
                          {dayShifts.length} pass • {dayHours.toFixed(1)} timmar • {Math.round(dayTotal).toLocaleString('sv-SE')} kr
                        </CardDescription>
                      </div>
                      <Badge variant={shiftDate >= new Date() ? "default" : "secondary"}>
                        {shiftDate >= new Date() ? "Kommande" : "Tidigare"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dayShifts.map((shift, shiftIndex) => {
                      const earnings = calculateShiftEarnings(shift);
                      
                      return (
                        <div 
                          key={shift.id} 
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                        >
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full ring-2 ring-background" 
                                style={{ backgroundColor: shift.jobs?.color }}
                              />
                              <span className="font-semibold">{shift.jobs?.name}</span>
                              <Badge variant="outline" className="ml-2">
                                {shift.hours}h
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="font-mono">
                                {shift.start_time} - {shift.end_time}
                              </span>
                              {earnings && (
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-chart-1">
                                    {earnings.totalNet.toFixed(0)} kr
                                  </span>
                                  {earnings.obAmount > 0 && (
                                    <span className="text-xs">
                                      (+{earnings.obAmount.toFixed(0)} kr OB)
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {shift.notes && (
                              <p className="text-sm text-muted-foreground italic">
                                {shift.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center space-x-1 ml-4">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleCopy(shift)}
                              title="Kopiera skift"
                              className="h-8 w-8 p-0"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEdit(shift)}
                              title="Redigera skift"
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(shift)}
                              title="Ta bort skift"
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="rounded-md border animate-fade-in">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jobb</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Tid</TableHead>
                  <TableHead>Timmar</TableHead>
                  <TableHead>Betalning</TableHead>
                  <TableHead>Anteckningar</TableHead>
                  <TableHead className="text-right">Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShifts?.map((shift) => {
                  const earnings = calculateShiftEarnings(shift);
                  
                  return (
                    <TableRow key={shift.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: shift.jobs?.color }}
                          />
                          <span className="font-medium">{shift.jobs?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(parseISO(shift.date), 'd MMM yyyy', { locale: sv })}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">
                          {shift.start_time} - {shift.end_time}
                        </span>
                      </TableCell>
                      <TableCell>
                        {shift.hours ? (
                          <Badge variant="secondary">{shift.hours}h</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {earnings ? (
                          <div>
                            <div className="font-semibold text-chart-1">
                              {earnings.totalNet.toFixed(0)} kr
                            </div>
                            {earnings.obAmount > 0 && (
                              <div className="text-xs text-muted-foreground">
                                +{earnings.obAmount.toFixed(0)} kr OB
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {shift.notes ? (
                          <span className="text-muted-foreground text-sm">
                            {shift.notes.length > 30 
                              ? `${shift.notes.substring(0, 30)}...` 
                              : shift.notes
                            }
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleCopy(shift)}
                            title="Kopiera skift"
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(shift)}
                            title="Redigera skift"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(shift)}
                            title="Ta bort skift"
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <AddShiftDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
        <EditShiftDialog 
          open={editDialogOpen} 
          onOpenChange={setEditDialogOpen}
          shift={selectedShift}
        />
        <DeleteShiftDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          shift={selectedShift}
        />
        <CopyShiftDialog
          open={copyDialogOpen}
          onOpenChange={setCopyDialogOpen}
          shift={selectedShift}
        />
      </div>
  );
};

export default Shifts;