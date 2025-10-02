import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart as BarChartIcon, TrendingUp, Calendar, Filter, DollarSign, Clock, Briefcase, Download, Percent, Trophy, Target, PieChart, CalendarDays, TrendingDown } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, PieChart as RePieChart, Pie, Cell } from "recharts";
import Header from "@/components/Header";
import { useShifts } from "@/hooks/useShifts";
import { useJobs } from "@/hooks/useJobs";
import { format, startOfWeek, getWeek, getMonth, getYear, isFuture, parseISO, startOfYear, endOfYear, isWithinInterval } from "date-fns";
import { sv } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const Statistics = () => {
  const { shifts, isLoading: shiftsLoading } = useShifts();
  const { jobs, isLoading: jobsLoading } = useJobs();
  const [selectedJobId, setSelectedJobId] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const isLoading = shiftsLoading || jobsLoading;

  // Get available years
  const availableYears = useMemo(() => {
    if (!shifts) return [];
    const years = new Set(shifts.map(shift => getYear(parseISO(shift.date))));
    return Array.from(years).sort((a, b) => b - a);
  }, [shifts]);

  // Filter shifts by year
  const filteredShiftsByYear = useMemo(() => {
    if (!shifts || selectedYear === "all") return shifts;
    return shifts.filter(shift => getYear(parseISO(shift.date)) === Number(selectedYear));
  }, [shifts, selectedYear]);

  // Summary statistics with tax breakdown
  const summaryStats = useMemo(() => {
    if (!filteredShiftsByYear || !jobs) return { 
      totalHours: 0, 
      totalSalaryNet: 0, 
      totalSalaryGross: 0,
      totalTax: 0,
      totalOBGross: 0,
      avgHourlyRate: 0, 
      shiftsCount: 0,
      avgPerShift: 0 
    };
    
    let totalHours = 0;
    let totalSalaryGross = 0;
    let totalOBGross = 0;
    
    filteredShiftsByYear.forEach(shift => {
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
          totalOBGross += obAmount;
        }
      }
      
      totalHours += hours;
      totalSalaryGross += (hours * hourlyRate) + obAmount;
    });
    
    const totalSalaryNet = totalSalaryGross * 0.67;
    const totalTax = totalSalaryGross * 0.33;
    
    return {
      totalHours: Math.round(totalHours * 10) / 10,
      totalSalaryNet: Math.round(totalSalaryNet),
      totalSalaryGross: Math.round(totalSalaryGross),
      totalTax: Math.round(totalTax),
      totalOBGross: Math.round(totalOBGross),
      avgHourlyRate: totalHours > 0 ? Math.round(totalSalaryNet / totalHours) : 0,
      shiftsCount: filteredShiftsByYear.length,
      avgPerShift: filteredShiftsByYear.length > 0 ? Math.round(totalSalaryNet / filteredShiftsByYear.length) : 0
    };
  }, [filteredShiftsByYear, jobs]);

  // Day of week analysis
  const dayOfWeekStats = useMemo(() => {
    if (!filteredShiftsByYear || !jobs) return [];

    const dayData: Record<number, { hours: number; earnings: number; count: number }> = {};
    const dayNames = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'];

    filteredShiftsByYear.forEach(shift => {
      const date = parseISO(shift.date);
      const dayOfWeek = date.getDay();
      
      if (!dayData[dayOfWeek]) {
        dayData[dayOfWeek] = { hours: 0, earnings: 0, count: 0 };
      }

      const hours = Number(shift.hours) || 0;
      const job = jobs.find(j => j.id === shift.job_id);
      const earnings = hours * (job?.hourly_rate || 0) * 0.67;

      dayData[dayOfWeek].hours += hours;
      dayData[dayOfWeek].earnings += earnings;
      dayData[dayOfWeek].count += 1;
    });

    return dayNames.map((name, index) => ({
      day: name,
      hours: dayData[index]?.hours || 0,
      earnings: Math.round(dayData[index]?.earnings || 0),
      avgPerShift: dayData[index]?.count > 0 ? Math.round(dayData[index].earnings / dayData[index].count) : 0,
      count: dayData[index]?.count || 0
    }));
  }, [filteredShiftsByYear, jobs]);

  // Job earnings breakdown (for pie chart)
  const jobEarningsBreakdown = useMemo(() => {
    if (!filteredShiftsByYear || !jobs) return [];

    const jobData: Record<string, { name: string; value: number; color: string }> = {};

    filteredShiftsByYear.forEach(shift => {
      const job = jobs.find(j => j.id === shift.job_id);
      if (!job) return;

      if (!jobData[job.id]) {
        jobData[job.id] = { name: job.name, value: 0, color: job.color || '#3B82F6' };
      }

      const hours = Number(shift.hours) || 0;
      const earnings = hours * (job.hourly_rate || 0) * 0.67;
      jobData[job.id].value += earnings;
    });

    return Object.values(jobData)
      .map(item => ({ ...item, value: Math.round(item.value) }))
      .sort((a, b) => b.value - a.value);
  }, [filteredShiftsByYear, jobs]);

  // Monthly statistics
  const monthlyStats = useMemo(() => {
    if (!filteredShiftsByYear || !jobs) return [];
    
    const monthlyData: Record<string, { hours: number; salary: number; sortKey: string }> = {};
    
    filteredShiftsByYear.forEach(shift => {
      const date = parseISO(shift.date);
      const monthKey = format(date, 'yyyy-MM', { locale: sv });
      const monthName = format(date, 'MMMM yyyy', { locale: sv });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { hours: 0, salary: 0, sortKey: monthKey };
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
        salary: Math.round(data.salary),
        sortKey: key
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [filteredShiftsByYear, jobs]);

  // Best performing months
  const bestMonths = useMemo(() => {
    return [...monthlyStats]
      .sort((a, b) => b.salary - a.salary)
      .slice(0, 3);
  }, [monthlyStats]);

  // Export to CSV functionality
  const exportToCSV = () => {
    if (!monthlyStats.length) {
      toast({ title: "Ingen data att exportera", variant: "destructive" });
      return;
    }

    const csvContent = [
      ['Månad', 'Timmar', 'Lön (kr)'],
      ...monthlyStats.map(stat => [stat.month, stat.hours.toFixed(1), stat.salary.toString()])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `statistik_${selectedYear !== 'all' ? selectedYear : 'alla_år'}.csv`;
    link.click();

    toast({ title: "Data exporterad", description: "CSV-fil nedladdad" });
  };

  // Weekly statistics  
  const weeklyStats = useMemo(() => {
    if (!filteredShiftsByYear || !jobs) return [];
    
    const weeklyData: Record<string, { hours: number; salary: number }> = {};
    
    filteredShiftsByYear.forEach(shift => {
      const date = parseISO(shift.date);
      const year = getYear(date);
      const weekNumber = getWeek(date, { weekStartsOn: 1 });
      const weekKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;
      
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
  }, [filteredShiftsByYear, jobs]);

  // Future shifts
  const futureShifts = useMemo(() => {
    if (!filteredShiftsByYear || !jobs) return [];
    
    return filteredShiftsByYear
      .filter(shift => isFuture(parseISO(shift.date)))
      .map(shift => {
        const job = jobs.find(j => j.id === shift.job_id);
        return {
          ...shift,
          jobName: job?.name || 'Okänt jobb'
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredShiftsByYear, jobs]);

  // Job-filtered monthly statistics
  const jobFilteredStats = useMemo(() => {
    if (!filteredShiftsByYear || !jobs || selectedJobId === "all") return monthlyStats;
    
    const monthlyData: Record<string, { hours: number; salary: number; sortKey: string }> = {};
    
    filteredShiftsByYear
      .filter(shift => shift.job_id === selectedJobId)
      .forEach(shift => {
        const date = parseISO(shift.date);
        const monthKey = format(date, 'yyyy-MM', { locale: sv });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { hours: 0, salary: 0, sortKey: monthKey };
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
        salary: Math.round(data.salary),
        sortKey: key
      }))
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [filteredShiftsByYear, jobs, selectedJobId, monthlyStats]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
            {[1, 2, 3, 4, 5].map(i => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-96 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Statistik</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Detaljerad översikt över dina arbetstimmar och intäkter</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Välj år" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla år</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportera CSV</span>
              <span className="sm:hidden">Exportera</span>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 mb-8 animate-fade-in">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Totala Timmar</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{summaryStats.totalHours}h</div>
              <p className="text-xs text-muted-foreground">{summaryStats.shiftsCount} skift</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Lön (Netto)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-chart-1">{summaryStats.totalSalaryNet.toLocaleString()} kr</div>
              <p className="text-xs text-muted-foreground">Efter 33% skatt</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Bruttolön</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{summaryStats.totalSalaryGross.toLocaleString()} kr</div>
              <p className="text-xs text-muted-foreground">Inkl. {summaryStats.totalOBGross.toLocaleString()} kr OB</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Genomsnitt/Timme</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{summaryStats.avgHourlyRate} kr</div>
              <p className="text-xs text-muted-foreground">Netto per timme</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Genomsnitt/Skift</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{summaryStats.avgPerShift} kr</div>
              <p className="text-xs text-muted-foreground">Snitt per arbetspass</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="monthly" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 lg:w-auto gap-1">
            <TabsTrigger value="monthly">Månad</TabsTrigger>
            <TabsTrigger value="weekly">Vecka</TabsTrigger>
            <TabsTrigger value="performance">Prestanda</TabsTrigger>
            <TabsTrigger value="dayOfWeek">Veckodagar</TabsTrigger>
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
              <CardContent className="px-2 sm:px-6">
                <div className="h-[300px] sm:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="month" 
                        className="text-[10px] sm:text-xs"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis yAxisId="left" className="text-[10px] sm:text-xs" />
                      <YAxis yAxisId="right" orientation="right" className="text-[10px] sm:text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '2px solid hsl(var(--primary))',
                          borderRadius: '8px',
                          padding: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', marginBottom: '8px' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
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
                        stroke="hsl(var(--chart-2))" 
                        strokeWidth={3}
                        name="Lön (kr)"
                        dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-6 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Månad</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Timmar</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Lön</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyStats.slice(-6).reverse().map((stat) => (
                        <TableRow key={stat.month}>
                          <TableCell className="font-medium text-xs sm:text-sm">{stat.month}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">{stat.hours.toFixed(1)}h</TableCell>
                          <TableCell className="text-right font-semibold text-xs sm:text-sm">{stat.salary.toLocaleString()} kr</TableCell>
                        </TableRow>
                      ))}
                      {monthlyStats.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8 text-xs sm:text-sm">
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

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              {/* Best Months */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-chart-3" />
                    <span>Bästa Månaderna</span>
                  </CardTitle>
                  <CardDescription>Top 3 inkomstmånader</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {bestMonths.map((month, index) => (
                    <div key={month.month} className="flex items-center justify-between p-3 sm:p-4 rounded-lg border bg-card">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <Badge variant={index === 0 ? "default" : "secondary"} className="text-base sm:text-lg shrink-0">
                          #{index + 1}
                        </Badge>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs sm:text-sm truncate">{month.month}</p>
                          <p className="text-xs text-muted-foreground">{month.hours.toFixed(1)} timmar</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-sm sm:text-lg font-bold text-chart-1">{month.salary.toLocaleString()} kr</p>
                      </div>
                    </div>
                  ))}
                  {bestMonths.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">Ingen data tillgänglig</p>
                  )}
                </CardContent>
              </Card>

              {/* Job Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="h-5 w-5 text-chart-2" />
                    <span>Inkomstfördelning per Jobb</span>
                  </CardTitle>
                  <CardDescription>Hur mycket tjänar du på varje jobb?</CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  {jobEarningsBreakdown.length > 0 ? (
                    <>
                      <div className="h-[200px] sm:h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <Pie
                              data={jobEarningsBreakdown}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={60}
                              fill="#8884d8"
                              dataKey="value"
                              stroke="hsl(var(--background))"
                              strokeWidth={2}
                            >
                              {jobEarningsBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => [`${value.toLocaleString()} kr`, 'Inkomst']}
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--background))',
                                border: '2px solid hsl(var(--primary))',
                                borderRadius: '8px',
                                padding: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                              }}
                              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', marginBottom: '8px' }}
                              itemStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                          </RePieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2 mt-4">
                        {jobEarningsBreakdown.map((job, index) => (
                          <div key={index} className="flex items-center justify-between text-xs sm:text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: job.color }} />
                              <span className="truncate">{job.name}</span>
                            </div>
                            <span className="font-semibold whitespace-nowrap ml-2">{job.value.toLocaleString()} kr</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-muted-foreground py-12">Ingen data tillgänglig</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tax Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Percent className="h-5 w-5 text-chart-4" />
                  <span>Skatteuppdelning</span>
                </CardTitle>
                <CardDescription>Brutto vs Netto inkomst</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm text-muted-foreground">Bruttolön</p>
                    <p className="text-2xl sm:text-3xl font-bold">{summaryStats.totalSalaryGross.toLocaleString()} kr</p>
                    <p className="text-xs text-muted-foreground">Före skatt</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm text-muted-foreground">Skatt (33%)</p>
                    <p className="text-2xl sm:text-3xl font-bold text-destructive">-{summaryStats.totalTax.toLocaleString()} kr</p>
                    <p className="text-xs text-muted-foreground">Preliminär skatt</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm text-muted-foreground">Nettolön</p>
                    <p className="text-2xl sm:text-3xl font-bold text-chart-1">{summaryStats.totalSalaryNet.toLocaleString()} kr</p>
                    <p className="text-xs text-muted-foreground">Efter skatt</p>
                  </div>
                </div>

                {summaryStats.totalOBGross > 0 && (
                  <div className="mt-6 p-3 sm:p-4 rounded-lg bg-accent/50 border">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <p className="text-xs sm:text-sm font-medium">OB-Tillägg (Brutto)</p>
                        <p className="text-xs text-muted-foreground mt-1">Extra ersättning för obekväm arbetstid</p>
                      </div>
                      <p className="text-xl sm:text-2xl font-bold text-chart-2">{summaryStats.totalOBGross.toLocaleString()} kr</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Day of Week Tab */}
          <TabsContent value="dayOfWeek" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CalendarDays className="h-5 w-5" />
                  <span>Analys per Veckodag</span>
                </CardTitle>
                <CardDescription>Se vilka dagar du arbetar mest och tjänar mest på</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                <div className="h-[300px] sm:h-[400px] mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dayOfWeekStats}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="day" className="text-[10px] sm:text-xs" />
                      <YAxis yAxisId="left" className="text-[10px] sm:text-xs" />
                      <YAxis yAxisId="right" orientation="right" className="text-[10px] sm:text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '2px solid hsl(var(--primary))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', marginBottom: '8px' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Legend />
                      <Bar 
                        yAxisId="left"
                        dataKey="hours" 
                        fill="hsl(var(--chart-3))" 
                        name="Timmar"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar 
                        yAxisId="right"
                        dataKey="earnings" 
                        fill="hsl(var(--chart-1))" 
                        name="Inkomst (kr)"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Veckodag</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Timmar</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Inkomst</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Antal Pass</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Snitt/Pass</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dayOfWeekStats.map((stat) => (
                        <TableRow key={stat.day}>
                          <TableCell className="font-medium text-xs sm:text-sm">{stat.day}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">{stat.hours.toFixed(1)}h</TableCell>
                          <TableCell className="text-right font-semibold text-xs sm:text-sm">{stat.earnings.toLocaleString()} kr</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">{stat.count}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">{stat.avgPerShift} kr</TableCell>
                        </TableRow>
                      ))}
                      {dayOfWeekStats.every(stat => stat.count === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-xs sm:text-sm">
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
              <CardContent className="px-2 sm:px-6">
                <div className="h-[300px] sm:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyStats.slice(-12)}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="week" 
                        className="text-[10px] sm:text-xs"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis yAxisId="left" className="text-[10px] sm:text-xs" />
                      <YAxis yAxisId="right" orientation="right" className="text-[10px] sm:text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '2px solid hsl(var(--primary))',
                          borderRadius: '8px',
                          padding: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', marginBottom: '8px' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
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
                
                <div className="mt-6 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Vecka</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Timmar</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Lön</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {weeklyStats.slice(-8).reverse().map((stat) => (
                        <TableRow key={stat.week}>
                          <TableCell className="font-medium text-xs sm:text-sm">{stat.week}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">{stat.hours.toFixed(1)}h</TableCell>
                          <TableCell className="text-right font-semibold text-xs sm:text-sm">{stat.salary.toLocaleString()} kr</TableCell>
                        </TableRow>
                      ))}
                      {weeklyStats.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8 text-xs sm:text-sm">
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Jobb</TableHead>
                        <TableHead className="text-xs sm:text-sm">Datum</TableHead>
                        <TableHead className="text-xs sm:text-sm">Tid</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Timmar</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {futureShifts.map((shift) => (
                        <TableRow key={shift.id}>
                          <TableCell className="font-medium text-xs sm:text-sm">{shift.jobName}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{format(parseISO(shift.date), 'PPP', { locale: sv })}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{shift.start_time} - {shift.end_time}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">{Number(shift.hours).toFixed(1)}h</TableCell>
                        </TableRow>
                      ))}
                      {futureShifts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-xs sm:text-sm">Inga kommande skift planerade</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
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
              <CardContent className="px-2 sm:px-6">
                <div className="h-[250px] sm:h-[300px] mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={jobFilteredStats}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="month" 
                        className="text-[10px] sm:text-xs"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis className="text-[10px] sm:text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '2px solid hsl(var(--primary))',
                          borderRadius: '8px',
                          padding: '12px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', marginBottom: '8px' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
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
                
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Månad</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Timmar</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Lön</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobFilteredStats.slice(-6).reverse().map((stat) => (
                        <TableRow key={stat.month}>
                          <TableCell className="font-medium text-xs sm:text-sm">{stat.month}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">{stat.hours.toFixed(1)}h</TableCell>
                          <TableCell className="text-right font-semibold text-xs sm:text-sm">{stat.salary.toLocaleString()} kr</TableCell>
                        </TableRow>
                      ))}
                      {jobFilteredStats.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8 text-xs sm:text-sm">
                            {selectedJobId === "all" 
                              ? "Ingen data tillgänglig" 
                              : "Ingen data för valt jobb"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Statistics;
