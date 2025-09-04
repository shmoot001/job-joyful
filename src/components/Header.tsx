import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, Home, Briefcase, CheckSquare, Clock, Calendar, BarChart, Menu, Dumbbell, TrendingUp } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const navItems = [
    { path: "/", label: "Hem", icon: Home },
    { path: "/jobs", label: "Jobb", icon: Briefcase },
    { path: "/tasks", label: "Uppgifter", icon: CheckSquare },
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
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold text-foreground">WorkTracker</h1>
            </div>
            <nav className="hidden md:flex space-x-4">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Button
                  key={path}
                  variant={location.pathname === path ? "default" : "ghost"}
                  onClick={() => navigate(path)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Button>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Theme toggle */}
            <ThemeToggle />
            
            {/* Mobile menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <DropdownMenuItem
                    key={path}
                    onClick={() => navigate(path)}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Sign out button */}
            <Button variant="ghost" onClick={handleSignOut} className="flex items-center space-x-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logga ut</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;