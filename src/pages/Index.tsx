import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, CheckSquare, TrendingUp, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Översikt över dina jobb, uppgifter och skift</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            onClick={() => navigate("/jobs")}
            className="cursor-pointer hover:shadow-lg transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mina Jobb</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">
                Aktiva arbetsplatser
              </p>
            </CardContent>
          </Card>

          <Card 
            onClick={() => navigate("/tasks")}
            className="cursor-pointer hover:shadow-lg transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mina Uppgifter</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                3 färdiga denna vecka
              </p>
            </CardContent>
          </Card>

          <Card 
            onClick={() => navigate("/shifts")}
            className="cursor-pointer hover:shadow-lg transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kommande Skift</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                Nästa: Imorgon 09:00
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Denna Månad</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">15,720 kr</div>
              <p className="text-xs text-muted-foreground">
                +12% från förra månaden
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Senaste Aktivitet</CardTitle>
              <CardDescription>Dina senaste jobb och uppgifter</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Slutförde uppgift "Månadsrapport"</span>
                  <Badge variant="secondary" className="ml-auto">2h sedan</Badge>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Registrerade skift på Företag AB</span>
                  <Badge variant="secondary" className="ml-auto">5h sedan</Badge>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">Skapade nytt jobb "Konsultuppdrag"</span>
                  <Badge variant="secondary" className="ml-auto">1d sedan</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Snabbåtgärder</CardTitle>
              <CardDescription>Vanliga åtgärder för att spara tid</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div 
                onClick={() => navigate("/jobs")}
                className="p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span className="font-medium">Lägg till nytt jobb</span>
                </div>
              </div>
              <div 
                onClick={() => navigate("/shifts")}
                className="p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-medium">Registrera skift</span>
                </div>
              </div>
              <div 
                onClick={() => navigate("/tasks")}
                className="p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <CheckSquare className="h-4 w-4 text-primary" />
                  <span className="font-medium">Skapa uppgift</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
