import { useState, useEffect, useRef } from "react";
import { Download, Upload, Database, FileJson, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useDataBackup } from "@/hooks/useDataBackup";

interface DataStats {
  jobs: number;
  shifts: number;
  tasks: number;
  notes: number;
  categories: number;
  cars: number;
  transactions: number;
}

export function DataBackupDialog() {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState<DataStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { exportData, importData, getStats, isExporting, isImporting } = useDataBackup();

  useEffect(() => {
    if (open) {
      setLoadingStats(true);
      getStats().then((data) => {
        setStats(data);
        setLoadingStats(false);
      });
    }
  }, [open]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await importData(file);
      // Refresh stats after import
      const newStats = await getStats();
      setStats(newStats);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const totalItems = stats
    ? stats.jobs + stats.shifts + stats.tasks + stats.notes + stats.categories + stats.cars + stats.transactions
    : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Database className="h-4 w-4" />
          Säkerhetskopia
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Säkerhetskopia av data
          </DialogTitle>
          <DialogDescription>
            Exportera eller importera din data som en JSON-fil
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Data Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Din nuvarande data</CardTitle>
              <CardDescription>
                {loadingStats ? "Laddar..." : `Totalt ${totalItems} poster`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jobb:</span>
                    <span className="font-medium">{stats.jobs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Skift:</span>
                    <span className="font-medium">{stats.shifts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uppgifter:</span>
                    <span className="font-medium">{stats.tasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Anteckningar:</span>
                    <span className="font-medium">{stats.notes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kategorier:</span>
                    <span className="font-medium">{stats.categories}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bilar:</span>
                    <span className="font-medium">{stats.cars}</span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-muted-foreground">Transaktioner:</span>
                    <span className="font-medium">{stats.transactions}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Export Section */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportera data
            </h4>
            <p className="text-sm text-muted-foreground">
              Ladda ner all din data som en JSON-fil. Du kan använda denna fil för att återställa din data senare.
            </p>
            <Button
              onClick={exportData}
              disabled={isExporting || totalItems === 0}
              className="w-full gap-2"
            >
              <FileJson className="h-4 w-4" />
              {isExporting ? "Exporterar..." : "Exportera till JSON"}
            </Button>
          </div>

          <Separator />

          {/* Import Section */}
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Importera data
            </h4>
            <p className="text-sm text-muted-foreground">
              Återställ data från en tidigare exporterad JSON-fil.
            </p>
            
            <Alert variant="destructive" className="bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Varning</AlertTitle>
              <AlertDescription>
                Import lägger till data utan att ta bort befintlig data. Duplikat kan uppstå.
              </AlertDescription>
            </Alert>

            <input
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full gap-2"
            >
              <Upload className="h-4 w-4" />
              {isImporting ? "Importerar..." : "Välj fil att importera"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
