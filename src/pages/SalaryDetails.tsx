import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, TrendingUp, DollarSign, Clock, Calendar } from "lucide-react";
import { useShifts } from "@/hooks/useShifts";
import { useJobs } from "@/hooks/useJobs";
import Header from "@/components/Header";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface SalaryData {
  id: string;
  date: string;
  jobName: string;
  jobColor: string;
  hours: number;
  hourlyRate: number;
  earnings: number;
  month: string;
}

const SalaryDetails = () => {
  const { shifts } = useShifts();
  const { jobs } = useJobs();
  const [selectedJob, setSelectedJob] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const salaryData = useMemo(() => {
    if (!shifts || !jobs) return [];

    return shifts
      .filter(shift => shift.hours && shift.hours > 0)
      .map(shift => {
        const job = jobs.find(j => j.id === shift.job_id);
        if (!job) return null;

        const earnings = ((shift.hours || 0) * job.hourly_rate) * 0.67; // After 33% tax
        const date = new Date(shift.date);
        const month = format(date, "yyyy-MM");

        return {
          id: shift.id,
          date: shift.date,
          jobName: job.name,
          jobColor: job.color,
          hours: shift.hours || 0,
          hourlyRate: job.hourly_rate,
          earnings,
          month
        };
      })
      .filter((item): item is SalaryData => item !== null);
  }, [shifts, jobs]);

  const filteredData = useMemo(() => {
    let filtered = salaryData;

    if (selectedJob !== "all") {
      filtered = filtered.filter(item => item.jobName === selectedJob);
    }

    if (selectedMonth !== "all") {
      filtered = filtered.filter(item => item.month === selectedMonth);
    }

    // Sort data
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof SalaryData];
      let bValue: any = b[sortBy as keyof SalaryData];

      if (sortBy === "date") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [salaryData, selectedJob, selectedMonth, sortBy, sortOrder]);

  const totalEarnings = filteredData.reduce((sum, item) => sum + item.earnings, 0);
  const totalHours = filteredData.reduce((sum, item) => sum + item.hours, 0);

  const uniqueJobs = Array.from(new Set(salaryData.map(item => item.jobName)));
  const uniqueMonths = Array.from(new Set(salaryData.map(item => item.month))).sort();

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Lönespecifikation', 20, 20);
    
    // Filters
    doc.setFontSize(12);
    let yPos = 40;
    if (selectedJob !== "all") {
      doc.text(`Jobb: ${selectedJob}`, 20, yPos);
      yPos += 10;
    }
    if (selectedMonth !== "all") {
      doc.text(`Månad: ${selectedMonth}`, 20, yPos);
      yPos += 10;
    }
    
    // Summary
    yPos += 10;
    doc.text(`Total intäkt: ${totalEarnings.toLocaleString()} kr`, 20, yPos);
    yPos += 10;
    doc.text(`Totala timmar: ${totalHours.toFixed(1)}h`, 20, yPos);
    yPos += 10;
    doc.text(`Genomsnittlig timlön: ${totalHours > 0 ? (totalEarnings / totalHours).toFixed(0) : 0} kr/h`, 20, yPos);
    
    // Table
    const tableData = filteredData.map(item => [
      format(new Date(item.date), 'dd MMM yyyy', { locale: sv }),
      item.jobName,
      `${item.hours.toFixed(1)}h`,
      `${item.hourlyRate} kr/h`,
      `${item.earnings.toLocaleString()} kr`
    ]);

    autoTable(doc, {
      startY: yPos + 20,
      head: [['Datum', 'Jobb', 'Timmar', 'Timlön', 'Intäkt']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    const filename = `lonespecifikation_${selectedJob !== "all" ? selectedJob.replace(/\s+/g, '_') : 'alla_jobb'}_${selectedMonth !== "all" ? selectedMonth : 'alla_manader'}.pdf`;
    doc.save(filename);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Lönedetaljer</h1>
          <p className="text-muted-foreground">Detaljerad översikt över dina intäkter</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Intäkt</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEarnings.toLocaleString()} kr</div>
              <p className="text-xs text-muted-foreground">
                Baserat på filtrerade data
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totala Timmar</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">
                Arbetade timmar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Genomsnittlig Timlön</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalHours > 0 ? (totalEarnings / totalHours).toFixed(0) : 0} kr/h
              </div>
              <p className="text-xs text-muted-foreground">
                Viktad genomsnitt
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Export */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filter och Export</CardTitle>
            <CardDescription>Filtrera data och exportera som PDF</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj jobb" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla jobb</SelectItem>
                  {uniqueJobs.map(job => (
                    <SelectItem key={job} value={job}>{job}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj månad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla månader</SelectItem>
                  {uniqueMonths.map(month => (
                    <SelectItem key={month} value={month}>
                      {format(new Date(month + "-01"), "MMM yyyy", { locale: sv })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sortera efter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Datum</SelectItem>
                  <SelectItem value="jobName">Jobb</SelectItem>
                  <SelectItem value="hours">Timmar</SelectItem>
                  <SelectItem value="earnings">Intäkt</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={exportToPDF} className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Exportera PDF</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lönespecifikation</CardTitle>
            <CardDescription>
              {filteredData.length} poster visas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort("date")}
                  >
                    Datum {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort("jobName")}
                  >
                    Jobb {sortBy === "jobName" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort("hours")}
                  >
                    Timmar {sortBy === "hours" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Timlön</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort("earnings")}
                  >
                    Intäkt {sortBy === "earnings" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {format(new Date(item.date), 'dd MMM yyyy', { locale: sv })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.jobColor }}
                        />
                        <span>{item.jobName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.hours.toFixed(1)}h</Badge>
                    </TableCell>
                    <TableCell>{item.hourlyRate} kr/h</TableCell>
                    <TableCell className="font-medium">
                      {item.earnings.toLocaleString()} kr
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredData.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Inga lönedata att visa med nuvarande filter</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalaryDetails;