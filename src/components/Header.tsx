import { Briefcase } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

const Header = () => {
  return (
    <header className="bg-card/50 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
      <div className="flex items-center h-14 px-4 gap-4">
        <SidebarTrigger />
        
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <Briefcase className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground">LifeHub</h1>
        </div>
        
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;