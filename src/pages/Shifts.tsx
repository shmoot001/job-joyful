import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Clock, Edit, Trash2, Calendar, Copy } from "lucide-react";
import { useShifts } from "@/hooks/useShifts";
import { useJobs } from "@/hooks/useJobs";
import { AddShiftDialog } from "@/components/shifts/AddShiftDialog";
import { EditShiftDialog } from "@/components/shifts/EditShiftDialog";
import { DeleteShiftDialog } from "@/components/shifts/DeleteShiftDialog";
import { CopyShiftDialog } from "@/components/shifts/CopyShiftDialog";
import Header from "@/components/Header";

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

  const filteredShifts = shifts?.filter((shift) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const shiftDate = new Date(shift.date);
    
    const jobMatch = jobFilter === "all" || shift.job_id === jobFilter;
    const timeMatch = timeFilter === "all" || 
      (timeFilter === "future" && shiftDate >= today) ||
      (timeFilter === "past" && shiftDate < today);
    
    return jobMatch && timeMatch;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Laddar skift...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mina Skift</h1>
            <p className="text-muted-foreground mt-2">Hantera dina arbetspass</p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Lägg till skift</span>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
        </div>

        {filteredShifts?.length === 0 ? (
          <Card>
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
        ) : (
          <div className="rounded-md border">
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
                {filteredShifts?.map((shift) => (
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
                        <span>{new Date(shift.date).toLocaleDateString('sv-SE')}</span>
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
                      {shift.jobs?.hourly_rate && shift.hours ? (
                        (() => {
                          const job = shift.jobs;
                          const baseEarnings = (job.hourly_rate * shift.hours);
                          
                          // Calculate OB if applicable
                          let obAmount = 0;
                          if (job.ob_rate > 0 && shift.date && shift.start_time && shift.end_time) {
                            const shiftDate = new Date(shift.date);
                            const dayOfWeek = shiftDate.getDay();
                            const [startHour] = shift.start_time.split(':').map(Number);
                            const [endHour] = shift.end_time.split(':').map(Number);
                            
                            // Simple OB calculation
                            let obHours = 0;
                            if (dayOfWeek === 0) { // Sunday
                              obHours = shift.hours;
                            } else if (dayOfWeek >= 1 && dayOfWeek <= 5 && (startHour >= 20 || endHour >= 20)) { // Mon-Fri after 20:00
                              obHours = shift.hours; // Simplified - could be more precise
                            } else if (dayOfWeek === 6 && (startHour >= 16 || endHour >= 16)) { // Saturday after 16:00
                              obHours = shift.hours; // Simplified - could be more precise
                            }
                            obAmount = obHours * job.ob_rate;
                          }
                          
                          const totalGross = baseEarnings + obAmount;
                          const totalNet = totalGross * 0.67; // After 33% tax
                          
                          return (
                            <div>
                              <div className="font-semibold text-primary">
                                {totalNet.toFixed(0)} kr
                              </div>
                              {obAmount > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  +{(obAmount * 0.67).toFixed(0)} kr OB
                                </div>
                              )}
                            </div>
                          );
                        })()
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
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEdit(shift)}
                          title="Redigera skift"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(shift)}
                          title="Ta bort skift"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
    </div>
  );
};

export default Shifts;