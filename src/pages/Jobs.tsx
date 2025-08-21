import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase, Edit, Trash2 } from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import { AddJobDialog } from "@/components/jobs/AddJobDialog";
import { EditJobDialog } from "@/components/jobs/EditJobDialog";
import { DeleteJobDialog } from "@/components/jobs/DeleteJobDialog";

const Jobs = () => {
  const { jobs, isLoading } = useJobs();
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Laddar jobb...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Mina Jobb</h1>
            <p className="text-muted-foreground mt-2">Hantera dina jobb och timlöner</p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Lägg till jobb</span>
          </Button>
        </div>

        {jobs?.length === 0 ? (
          <Card>
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
            {jobs?.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: job.color }}
                      />
                      <CardTitle className="text-lg">{job.name}</CardTitle>
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEdit(job)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(job)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{job.description || "Ingen beskrivning"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">
                    {job.hourly_rate} kr/tim
                  </Badge>
                </CardContent>
              </Card>
            ))}
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
    </div>
  );
};

export default Jobs;