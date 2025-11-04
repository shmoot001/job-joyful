import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, Home, Briefcase, CheckSquare, Clock, Calendar, BarChart, Menu, Dumbbell, TrendingUp, ListTodo, CalendarClock } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Header = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const navItems = [
    { path: "/", label: "Hem", icon: Home },
    { path: "/daily-todo", label: "Dagslista", icon: ListTodo },
    { path: "/day-schedule", label: "Dagschema", icon: CalendarClock },
    { path: "/tasks", label: "Uppgifter", icon: CheckSquare },
    { path: "/jobs", label: "Jobb", icon: Briefcase },
    { path: "/shifts", label: "Skift", icon: Clock },
    { path: "/calendar", label: "Kalender", icon: Calendar },
    { path: "/workouts", label: "Träning", icon: Dumbbell },
    { path: "/business", label: "Business", icon: TrendingUp },
    { path: "/statistics", label: "Statistik", icon: BarChart },
  ];

  return (
    <header className="bg-card/50 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4 lg:space-x-8">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">WorkTracker</h1>
            </div>
            <nav className="hidden lg:flex space-x-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Button
                  key={path}
                  variant={location.pathname === path ? "default" : "ghost"}
                  onClick={() => navigate(path)}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Button>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            
            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col space-y-2 mt-6">
                  {navItems.map(({ path, label, icon: Icon }) => (
                    <Button
                      key={path}
                      variant={location.pathname === path ? "default" : "ghost"}
                      onClick={() => handleNavigation(path)}
                      className="flex items-center justify-start space-x-3 w-full"
                    >
                      <Icon className="h-5 w-5" />
                      <span>{label}</span>
                    </Button>
                  ))}
                  <div className="pt-4 border-t border-border mt-4">
                    <Button 
                      variant="ghost" 
                      onClick={handleSignOut} 
                      className="flex items-center justify-start space-x-3 w-full text-destructive hover:text-destructive"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Logga ut</span>
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
            
            {/* Desktop sign out button */}
            <Button variant="ghost" onClick={handleSignOut} className="hidden lg:flex items-center space-x-2">
              <LogOut className="h-4 w-4" />
              <span>Logga ut</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;