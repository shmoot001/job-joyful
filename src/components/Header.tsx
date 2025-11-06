import ThemeToggle from "@/components/ThemeToggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

const Header = () => {
  return (
    <header className="bg-card/50 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
      <div className="flex items-center h-14 px-4 gap-4">
        <SidebarTrigger />
        
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;