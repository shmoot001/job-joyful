import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, Home, Briefcase, CheckSquare, Clock, Calendar } from "lucide-react";

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
  ];

  return (
    <header className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-foreground">WorkTracker</h1>
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
          <Button variant="ghost" onClick={handleSignOut} className="flex items-center space-x-2">
            <LogOut className="h-4 w-4" />
            <span>Logga ut</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;