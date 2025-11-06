import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Briefcase, Edit, Trash2, TrendingUp, Clock, Calendar, DollarSign } from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import { useShifts } from "@/hooks/useShifts";
import { AddJobDialog } from "@/components/jobs/AddJobDialog";
import { EditJobDialog } from "@/components/jobs/EditJobDialog";
import { DeleteJobDialog } from "@/components/jobs/DeleteJobDialog";

import { parseISO, format } from "date-fns";
import { sv } from "date-fns/locale";

const Jobs = () => {
  const { jobs, isLoading: jobsLoading } = useJobs();
  const { shifts, isLoading: shiftsLoading } = useShifts();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const handleEdit = (job: any) => {
    setSelectedJob(job);
    setEditDialogOpen(true);
  };

  const handleDelete = (job: any) => {
    setSelectedJob(job);
    setDeleteDialogOpen(true);
  };

  // Calculate job statistics
  const jobStats = useMemo(() => {
    if (!jobs || !shifts) return {};
    
    const stats: Record<string, {
      totalHours: number;
      totalEarnings: number;
      shiftCount: number;
      lastWorked: string | null;
    }> = {};

    jobs.forEach(job => {
      const jobShifts = shifts.filter(s => s.job_id === job.id);
      const totalHours = jobShifts.reduce((sum, shift) => sum + (Number(shift.hours) || 0), 0);
      const lastShift = jobShifts.sort((a, b) => 
        parseISO(b.date).getTime() - parseISO(a.date).getTime()
      )[0];
      
      stats[job.id] = {
        totalHours,
        totalEarnings: totalHours * Number(job.hourly_rate),
        shiftCount: jobShifts.length,
        lastWorked: lastShift ? lastShift.date : null
      };
    });

    return stats;
  }, [jobs, shifts]);

  // Calculate overview statistics
  const overviewStats = useMemo(() => {
    if (!jobs || !shifts) return {
      totalJobs: 0,
      activeJobs: 0,
      avgHourlyRate: 0,
      totalEarnings: 0
    };

    const activeJobIds = new Set(shifts.map(s => s.job_id));
    const totalEarnings = Object.values(jobStats).reduce(
      (sum, stat) => sum + stat.totalEarnings, 0
    );
    const avgRate = jobs.reduce((sum, job) => sum + Number(job.hourly_rate), 0) / jobs.length;

    return {
      totalJobs: jobs.length,
      activeJobs: activeJobIds.size,
      avgHourlyRate: Math.round(avgRate),
      totalEarnings: Math.round(totalEarnings)
    };
  }, [jobs, shifts, jobStats]);

  const isLoading = jobsLoading || shiftsLoading;

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mina Jobb</h1>
            <p className="text-muted-foreground mt-2">Hantera dina jobb och timlöner</p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Lägg till jobb</span>
          </Button>
        </div>

        {/* Overview Statistics */}
        {jobs && jobs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Totalt antal jobb</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <Briefcase className="h-6 w-6 text-primary" />
                  {overviewStats.totalJobs}
                </CardTitle>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Aktiva jobb</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-chart-2" />
                  {overviewStats.activeJobs}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Genomsnittlig timlön</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-chart-3" />
                  {overviewStats.avgHourlyRate} kr
                </CardTitle>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total inkomst</CardDescription>
                <CardTitle className="text-3xl flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-chart-1" />
                  {overviewStats.totalEarnings.toLocaleString('sv-SE')} kr
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {jobs?.length === 0 ? (
          <Card className="animate-fade-in">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Inga jobb ännu</h3>
              <p className="text-muted-foreground text-center mb-4">
                Kom igång genom att lägga till ditt första jobb
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Lägg till jobb
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs?.map((job, index) => {
              const stats = jobStats[job.id] || { totalHours: 0, totalEarnings: 0, shiftCount: 0, lastWorked: null };
              const isActive = stats.shiftCount > 0;
              
              return (
                <Card 
                  key={job.id} 
                  className="hover:shadow-lg transition-all duration-300 hover-scale animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full ring-2 ring-background shadow-sm" 
                          style={{ backgroundColor: job.color }}
                        />
                        <CardTitle className="text-lg">{job.name}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-1">
                        {isActive && (
                          <Badge variant="outline" className="text-xs border-chart-2 text-chart-2">
                            Aktiv
                          </Badge>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(job)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(job)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="min-h-[40px]">
                      {job.description || "Ingen beskrivning"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Rate Information */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-sm">
                        {job.hourly_rate} kr/tim
                      </Badge>
                      {Number(job.ob_rate) > 0 && (
                        <Badge variant="outline" className="text-sm">
                          OB: {job.ob_rate} kr
                        </Badge>
                      )}
                      {Number(job.break_time) > 0 && (
                        <Badge variant="outline" className="text-sm">
                          <Clock className="h-3 w-3 mr-1" />
                          Rast: {job.break_time} min
                        </Badge>
                      )}
                    </div>

                    {/* Statistics */}
                    {isActive ? (
                      <div className="space-y-3 pt-3 border-t">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Totala timmar</span>
                          <span className="font-semibold">{stats.totalHours.toFixed(1)} h</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Total inkomst</span>
                          <span className="font-semibold text-chart-1">
                            {Math.round(stats.totalEarnings).toLocaleString('sv-SE')} kr
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Antal pass</span>
                          <span className="font-semibold">{stats.shiftCount}</span>
                        </div>
                        {stats.lastWorked && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Senast arbetad
                            </span>
                            <span className="font-medium">
                              {format(parseISO(stats.lastWorked), 'd MMM yyyy', { locale: sv })}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="pt-3 border-t">
                        <p className="text-sm text-muted-foreground text-center py-2">
                          Inga pass registrerade ännu
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <AddJobDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
        <EditJobDialog 
          open={editDialogOpen} 
          onOpenChange={setEditDialogOpen}
          job={selectedJob}
        />
        <DeleteJobDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          job={selectedJob}
        />
      </div>
  );
};

export default Jobs;