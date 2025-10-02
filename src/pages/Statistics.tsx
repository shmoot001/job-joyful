import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart as BarChartIcon, TrendingUp, Calendar, Filter, DollarSign, Clock, Briefcase } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area } from "recharts";
import Header from "@/components/Header";
import { useShifts } from "@/hooks/useShifts";
import { useJobs } from "@/hooks/useJobs";
import { format, startOfWeek, getWeek, getMonth, getYear, isFuture, parseISO } from "date-fns";
import { sv } from "date-fns/locale";

const Statistics = () => {
  const { shifts, isLoading: shiftsLoading } = useShifts();
  const { jobs, isLoading: jobsLoading } = useJobs();
  const [selectedJobId, setSelectedJobId] = useState<string>("all");

  const isLoading = shiftsLoading || jobsLoading;

  // Summary statistics
  const summaryStats = useMemo(() => {
    if (!shifts || !jobs) return { totalHours: 0, totalSalary: 0, avgHourlyRate: 0, shiftsCount: 0 };
    
    let totalHours = 0;
    let totalSalary = 0;
    
    shifts.forEach(shift => {
      const hours = Number(shift.hours) || 0;
      const job = jobs.find(j => j.id === shift.job_id);
      const hourlyRate = job?.hourly_rate || 0;
      const obRate = job?.ob_rate || 0;
      
      let obAmount = 0;
      if (obRate > 0 && shift.date && shift.start_time && shift.end_time) {
        const shiftDate = new Date(shift.date);
        const dayOfWeek = shiftDate.getDay();
        const [startHour] = shift.start_time.split(':').map(Number);
        const [endHour] = shift.end_time.split(':').map(Number);
        
        if (dayOfWeek === 0 || 
            (dayOfWeek >= 1 && dayOfWeek <= 5 && (startHour >= 20 || endHour >= 20)) || 
            (dayOfWeek === 6 && (startHour >= 16 || endHour >= 16))) {
          obAmount = hours * obRate;
        }
      }
      
      totalHours += hours;
      totalSalary += ((hours * hourlyRate) + obAmount) * 0.67;
    });
    
    return {
      totalHours: Math.round(totalHours * 10) / 10,
      totalSalary: Math.round(totalSalary),
      avgHourlyRate: totalHours > 0 ? Math.round(totalSalary / totalHours) : 0,
      shiftsCount: shifts.length
    };
  }, [shifts, jobs]);

  // Monthly statistics
  const monthlyStats = useMemo(() => {
    if (!shifts || !jobs) return [];
    
    const monthlyData: Record<string, { hours: number; salary: number }> = {};
    
    shifts.forEach(shift => {
      const date = parseISO(shift.date);
      const monthKey = format(date, 'yyyy-MM', { locale: sv });
      const monthName = format(date, 'MMMM yyyy', { locale: sv });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { hours: 0, salary: 0 };
      }
      
      const hours = Number(shift.hours) || 0;
      const job = jobs.find(j => j.id === shift.job_id);
      const hourlyRate = job?.hourly_rate || 0;
      const obRate = job?.ob_rate || 0;
      
      let obAmount = 0;
      if (obRate > 0 && shift.date && shift.start_time && shift.end_time) {
        const shiftDate = new Date(shift.date);
        const dayOfWeek = shiftDate.getDay();
        const [startHour] = shift.start_time.split(':').map(Number);
        const [endHour] = shift.end_time.split(':').map(Number);
        
        // Simple OB calculation
        if (dayOfWeek === 0 || // Sunday
            (dayOfWeek >= 1 && dayOfWeek <= 5 && (startHour >= 20 || endHour >= 20)) || // Mon-Fri after 20:00
            (dayOfWeek === 6 && (startHour >= 16 || endHour >= 16))) { // Saturday after 16:00
          obAmount = hours * obRate;
        }
      }
      
      monthlyData[monthKey].hours += hours;
      monthlyData[monthKey].salary += ((hours * hourlyRate) + obAmount) * 0.67; // After 33% tax
    });
    
    return Object.entries(monthlyData)
      .map(([key, data]) => ({
        month: format(parseISO(key + '-01'), 'MMMM yyyy', { locale: sv }),
        hours: data.hours,
        salary: Math.round(data.salary)
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [shifts, jobs]);

  // Weekly statistics
  const weeklyStats = useMemo(() => {
    if (!shifts || !jobs) return [];
    
    const weeklyData: Record<string, { hours: number; salary: number }> = {};
    
    shifts.forEach(shift => {
      const date = parseISO(shift.date);
      const year = getYear(date);
      const weekNumber = getWeek(date, { weekStartsOn: 1 });
      const weekKey = `${year}-W${weekNumber}`;
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { hours: 0, salary: 0 };
      }
      
      const hours = Number(shift.hours) || 0;
      const job = jobs.find(j => j.id === shift.job_id);
      const hourlyRate = job?.hourly_rate || 0;
      const obRate = job?.ob_rate || 0;
      
      let obAmount = 0;
      if (obRate > 0 && shift.date && shift.start_time && shift.end_time) {
        const shiftDate = new Date(shift.date);
        const dayOfWeek = shiftDate.getDay();
        const [startHour] = shift.start_time.split(':').map(Number);
        const [endHour] = shift.end_time.split(':').map(Number);
        
        // Simple OB calculation
        if (dayOfWeek === 0 || // Sunday
            (dayOfWeek >= 1 && dayOfWeek <= 5 && (startHour >= 20 || endHour >= 20)) || // Mon-Fri after 20:00
            (dayOfWeek === 6 && (startHour >= 16 || endHour >= 16))) { // Saturday after 16:00
          obAmount = hours * obRate;
        }
      }
      
      weeklyData[weekKey].hours += hours;
      weeklyData[weekKey].salary += ((hours * hourlyRate) + obAmount) * 0.67; // After 33% tax
    });
    
    return Object.entries(weeklyData)
      .map(([key, data]) => ({
        week: key,
        hours: data.hours,
        salary: Math.round(data.salary)
      }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [shifts, jobs]);

  // Future shifts
  const futureShifts = useMemo(() => {
    if (!shifts || !jobs) return [];
    
    return shifts
      .filter(shift => isFuture(parseISO(shift.date)))
      .map(shift => {
        const job = jobs.find(j => j.id === shift.job_id);
        return {
          ...shift,
          jobName: job?.name || 'Okänt jobb'
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [shifts, jobs]);

  // Job-filtered monthly statistics
  const jobFilteredStats = useMemo(() => {
    if (!shifts || !jobs || selectedJobId === "all") return monthlyStats;
    
    const monthlyData: Record<string, { hours: number; salary: number }> = {};
    
    shifts
      .filter(shift => shift.job_id === selectedJobId)
      .forEach(shift => {
        const date = parseISO(shift.date);
        const monthKey = format(date, 'yyyy-MM', { locale: sv });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { hours: 0, salary: 0 };
        }
        
        const hours = Number(shift.hours) || 0;
        const job = jobs.find(j => j.id === shift.job_id);
        const hourlyRate = job?.hourly_rate || 0;
        const obRate = job?.ob_rate || 0;
        
        let obAmount = 0;
        if (obRate > 0 && shift.date && shift.start_time && shift.end_time) {
          const shiftDate = new Date(shift.date);
          const dayOfWeek = shiftDate.getDay();
          const [startHour] = shift.start_time.split(':').map(Number);
          const [endHour] = shift.end_time.split(':').map(Number);
          
          // Simple OB calculation
          if (dayOfWeek === 0 || // Sunday
              (dayOfWeek >= 1 && dayOfWeek <= 5 && (startHour >= 20 || endHour >= 20)) || // Mon-Fri after 20:00
              (dayOfWeek === 6 && (startHour >= 16 || endHour >= 16))) { // Saturday after 16:00
            obAmount = hours * obRate;
          }
        }
        
        monthlyData[monthKey].hours += hours;
        monthlyData[monthKey].salary += ((hours * hourlyRate) + obAmount) * 0.67; // After 33% tax
      });
    
    return Object.entries(monthlyData)
      .map(([key, data]) => ({
        month: format(parseISO(key + '-01'), 'MMMM yyyy', { locale: sv }),
        hours: data.hours,
        salary: Math.round(data.salary)
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [shifts, jobs, selectedJobId, monthlyStats]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Laddar statistik...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Statistik</h1>
          <p className="text-muted-foreground">Detaljerad översikt över dina arbetstimmar och intäkter</p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totala Timmar</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.totalHours}h</div>
              <p className="text-xs text-muted-foreground">Alla registrerade skift</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lön</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.totalSalary.toLocaleString()} kr</div>
              <p className="text-xs text-muted-foreground">Efter skatt (67%)</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Genomsnitt/Timme</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.avgHourlyRate} kr</div>
              <p className="text-xs text-muted-foreground">Inkl. OB och efter skatt</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Antal Skift</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.shiftsCount}</div>
              <p className="text-xs text-muted-foreground">Totalt antal arbetade skift</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="monthly" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="monthly">Månad</TabsTrigger>
            <TabsTrigger value="weekly">Vecka</TabsTrigger>
            <TabsTrigger value="upcoming">Kommande</TabsTrigger>
            <TabsTrigger value="byJob">Per Jobb</TabsTrigger>
          </TabsList>

          {/* Monthly Tab */}
          <TabsContent value="monthly" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Månadsöversikt</span>
                </CardTitle>
                <CardDescription>Timmar och lön per månad</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="month" 
                        className="text-xs"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis yAxisId="left" className="text-xs" />
                      <YAxis yAxisId="right" orientation="right" className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar 
                        yAxisId="left"
                        dataKey="hours" 
                        fill="hsl(var(--primary))" 
                        name="Timmar"
                        radius={[8, 8, 0, 0]}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="salary" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={2}
                        name="Lön (kr)"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Månad</TableHead>
                        <TableHead className="text-right">Timmar</TableHead>
                        <TableHead className="text-right">Lön</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyStats.slice(-6).reverse().map((stat) => (
                        <TableRow key={stat.month}>
                          <TableCell className="font-medium">{stat.month}</TableCell>
                          <TableCell className="text-right">{stat.hours.toFixed(1)}h</TableCell>
                          <TableCell className="text-right font-semibold">{stat.salary.toLocaleString()} kr</TableCell>
                        </TableRow>
                      ))}
                      {monthlyStats.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            Ingen data tillgänglig
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Weekly Tab */}
          <TabsContent value="weekly" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChartIcon className="h-5 w-5" />
                  <span>Veckoöversikt</span>
                </CardTitle>
                <CardDescription>Timmar och lön per vecka</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyStats.slice(-12)}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="week" 
                        className="text-xs"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis yAxisId="left" className="text-xs" />
                      <YAxis yAxisId="right" orientation="right" className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar 
                        yAxisId="left"
                        dataKey="hours" 
                        fill="hsl(var(--primary))" 
                        name="Timmar"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar 
                        yAxisId="right"
                        dataKey="salary" 
                        fill="hsl(var(--accent))" 
                        name="Lön (kr)"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vecka</TableHead>
                        <TableHead className="text-right">Timmar</TableHead>
                        <TableHead className="text-right">Lön</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weeklyStats.slice(-8).reverse().map((stat) => (
                        <TableRow key={stat.week}>
                          <TableCell className="font-medium">{stat.week}</TableCell>
                          <TableCell className="text-right">{stat.hours.toFixed(1)}h</TableCell>
                          <TableCell className="text-right font-semibold">{stat.salary.toLocaleString()} kr</TableCell>
                        </TableRow>
                      ))}
                      {weeklyStats.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            Ingen data tillgänglig
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upcoming Tab */}
          <TabsContent value="upcoming" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Kommande Skift</span>
                </CardTitle>
                <CardDescription>
                  {futureShifts.length > 0 
                    ? `${futureShifts.length} planerade skift` 
                    : 'Inga kommande skift'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jobb</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Tid</TableHead>
                      <TableHead className="text-right">Timmar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {futureShifts.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell className="font-medium">{shift.jobName}</TableCell>
                        <TableCell>{format(parseISO(shift.date), 'PPP', { locale: sv })}</TableCell>
                        <TableCell>{shift.start_time} - {shift.end_time}</TableCell>
                        <TableCell className="text-right">{Number(shift.hours).toFixed(1)}h</TableCell>
                      </TableRow>
                    ))}
                    {futureShifts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Inga kommande skift planerade</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* By Job Tab */}
          <TabsContent value="byJob" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Statistik per Jobb</span>
                </CardTitle>
                <CardDescription>Filtrera månadsstatistik baserat på jobb</CardDescription>
                <div className="mt-4">
                  <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue placeholder="Välj jobb" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alla jobb</SelectItem>
                      {jobs?.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={jobFilteredStats}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="month" 
                        className="text-xs"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="hours" 
                        fill="hsl(var(--primary))" 
                        name="Timmar"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Månad</TableHead>
                      <TableHead className="text-right">Timmar</TableHead>
                      <TableHead className="text-right">Lön</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobFilteredStats.slice(-6).reverse().map((stat) => (
                      <TableRow key={stat.month}>
                        <TableCell className="font-medium">{stat.month}</TableCell>
                        <TableCell className="text-right">{stat.hours.toFixed(1)}h</TableCell>
                        <TableCell className="text-right font-semibold">{stat.salary.toLocaleString()} kr</TableCell>
                      </TableRow>
                    ))}
                    {jobFilteredStats.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          {selectedJobId === "all" 
                            ? "Ingen data tillgänglig" 
                            : "Ingen data för valt jobb"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Statistics;
