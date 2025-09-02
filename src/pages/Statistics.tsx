import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, TrendingUp, Calendar, Filter } from "lucide-react";
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
      
      monthlyData[monthKey].hours += hours;
      monthlyData[monthKey].salary += hours * hourlyRate;
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
      
      weeklyData[weekKey].hours += hours;
      weeklyData[weekKey].salary += hours * hourlyRate;
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
        
        monthlyData[monthKey].hours += hours;
        monthlyData[monthKey].salary += hours * hourlyRate;
      });
    
    return Object.entries(monthlyData)
      .map(([key, data]) => ({
        month: format(parseISO(key + '-01'), 'MMMM yyyy', { locale: sv }),
        hours: data.hours,
        salary: Math.round(data.salary)
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [shifts, jobs, selectedJobId]);

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

        <div className="space-y-8">
          {/* Monthly Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Månadsstatistik</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Månad</TableHead>
                    <TableHead>Timmar</TableHead>
                    <TableHead>Lön</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyStats.map((stat) => (
                    <TableRow key={stat.month}>
                      <TableCell className="font-medium">{stat.month}</TableCell>
                      <TableCell>{stat.hours.toFixed(1)}h</TableCell>
                      <TableCell>{stat.salary.toLocaleString()} kr</TableCell>
                    </TableRow>
                  ))}
                  {monthlyStats.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Ingen data tillgänglig
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Weekly Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart className="h-5 w-5" />
                <span>Veckostatistik</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vecka</TableHead>
                    <TableHead>Timmar</TableHead>
                    <TableHead>Lön</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weeklyStats.map((stat) => (
                    <TableRow key={stat.week}>
                      <TableCell className="font-medium">{stat.week}</TableCell>
                      <TableCell>{stat.hours.toFixed(1)}h</TableCell>
                      <TableCell>{stat.salary.toLocaleString()} kr</TableCell>
                    </TableRow>
                  ))}
                  {weeklyStats.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Ingen data tillgänglig
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Future Shifts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Kommande Skift</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jobb</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Tid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {futureShifts.map((shift) => (
                    <TableRow key={shift.id}>
                      <TableCell className="font-medium">{shift.jobName}</TableCell>
                      <TableCell>{format(parseISO(shift.date), 'PPP', { locale: sv })}</TableCell>
                      <TableCell>{shift.start_time} - {shift.end_time}</TableCell>
                    </TableRow>
                  ))}
                  {futureShifts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Inga kommande skift
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Job-Filtered Monthly Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Månadsstatistik per Jobb</span>
              </CardTitle>
              <div className="mt-4">
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger className="w-64">
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Månad</TableHead>
                    <TableHead>Timmar</TableHead>
                    <TableHead>Lön</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobFilteredStats.map((stat) => (
                    <TableRow key={stat.month}>
                      <TableCell className="font-medium">{stat.month}</TableCell>
                      <TableCell>{stat.hours.toFixed(1)}h</TableCell>
                      <TableCell>{stat.salary.toLocaleString()} kr</TableCell>
                    </TableRow>
                  ))}
                  {jobFilteredStats.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Ingen data tillgänglig för valt jobb
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Statistics;