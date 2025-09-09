import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, CheckSquare, TrendingUp, Clock, Calendar, Target, Activity, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useDashboard } from "@/hooks/useDashboard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart } from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', '#8884d8', '#82ca9d'];

const Index = () => {
  const navigate = useNavigate();
  const { stats, monthlyEarnings, monthlyHours, tasksByCategory, recentActivity, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Laddar dashboard...</div>
        </div>
      </div>
    );
  }

  const completionRate = stats?.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Översikt över dina jobb, uppgifter och intäkter</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card 
            onClick={() => navigate("/jobs")}
            className="cursor-pointer hover:shadow-lg transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktiva Jobb</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalJobs || 0}</div>
              <p className="text-xs text-muted-foreground">
                Registrerade arbetsplatser
              </p>
            </CardContent>
          </Card>

          <Card 
            onClick={() => navigate("/tasks")}
            className="cursor-pointer hover:shadow-lg transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uppgifter</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.completedTasks || 0}/{stats?.totalTasks || 0}</div>
              <p className="text-xs text-muted-foreground">
                {completionRate}% färdiga
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
              <div className="text-2xl font-bold">{stats?.upcomingShifts || 0}</div>
              <p className="text-xs text-muted-foreground">
                Planerade arbetspass
              </p>
            </CardContent>
          </Card>

          <Card 
            onClick={() => navigate("/salary-details")}
            className="cursor-pointer hover:shadow-lg transition-shadow"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Denna Månad</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats?.monthlyEarnings || 0).toLocaleString()} kr</div>
              <p className="text-xs text-muted-foreground">
                {Math.round(stats?.weeklyHours || 0)}h denna vecka
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Earnings Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Månadsintäkter</span>
              </CardTitle>
              <CardDescription>Intäkter och arbetade timmar per månad</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={monthlyEarnings}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'earnings' ? `${Math.round(Number(value)).toLocaleString()} kr` : `${Number(value).toFixed(1)}h`,
                      name === 'earnings' ? 'Intäkter' : 'Timmar'
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#earningsGradient)"
                    strokeWidth={3}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="hours" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
                  />
                  <defs>
                    <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Working Hours Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Månatliga Arbetstimmar</span>
              </CardTitle>
              <CardDescription>Totala arbetstimmar och antal skift per månad</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyHours}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'hours' ? `${Number(value).toFixed(1)}h` : `${value} skift`,
                      name === 'hours' ? 'Arbetstimmar' : 'Antal skift'
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="hsl(var(--primary))" 
                    fill="url(#hoursGradient)"
                    strokeWidth={3}
                  />
                  <defs>
                    <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tasks and Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Tasks by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Uppgifter per Kategori</span>
              </CardTitle>
              <CardDescription>Fördelning av slutförda vs totala uppgifter</CardDescription>
            </CardHeader>
            <CardContent>
              {tasksByCategory && tasksByCategory.length > 0 ? (
                <div className="space-y-4">
                  {tasksByCategory.map((category, index) => {
                    const completionPercent = Math.round((category.completed / category.total) * 100);
                    return (
                      <div key={category.category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{category.category}</span>
                          <span className="text-sm text-muted-foreground">
                            {category.completed}/{category.total} ({completionPercent}%)
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${completionPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Inga uppgifter att visa</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Senaste Aktivitet</span>
              </CardTitle>
              <CardDescription>Dina senaste åtgärder och uppdateringar</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.slice(0, 8).map((activity) => {
                    const timeAgo = new Date().getTime() - new Date(activity.timestamp).getTime();
                    const hours = Math.floor(timeAgo / (1000 * 60 * 60));
                    const days = Math.floor(hours / 24);
                    
                    let timeText = "";
                    if (days > 0) {
                      timeText = `${days}d sedan`;
                    } else if (hours > 0) {
                      timeText = `${hours}h sedan`;
                    } else {
                      timeText = "Just nu";
                    }

                    return (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {activity.type === "shift" && <Clock className="h-4 w-4 text-blue-500 mt-0.5" />}
                          {activity.type === "task" && <CheckSquare className="h-4 w-4 text-green-500 mt-0.5" />}
                          {activity.type === "job" && <Briefcase className="h-4 w-4 text-purple-500 mt-0.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">{timeText}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ingen aktivitet att visa</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Snabbåtgärder</CardTitle>
            <CardDescription>Vanliga åtgärder för att spara tid</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div 
              onClick={() => navigate("/jobs")}
              className="p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Briefcase className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-medium">Lägg till nytt jobb</h3>
                  <p className="text-sm text-muted-foreground">Registrera en ny arbetsplats</p>
                </div>
              </div>
            </div>
            <div 
              onClick={() => navigate("/shifts")}
              className="p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-medium">Registrera skift</h3>
                  <p className="text-sm text-muted-foreground">Lägg till ett arbetspass</p>
                </div>
              </div>
            </div>
            <div 
              onClick={() => navigate("/tasks")}
              className="p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
            >
              <div className="flex items-center space-x-3">
                <CheckSquare className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-medium">Skapa uppgift</h3>
                  <p className="text-sm text-muted-foreground">Lägg till en ny todo</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;