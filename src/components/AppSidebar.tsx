import { Home, Briefcase, CheckSquare, Clock, Calendar, BarChart, Dumbbell, TrendingUp, ListTodo, CalendarClock, StickyNote, LogOut, Car, Settings, FolderKanban, LineChart } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navItems = [
  { path: "/", label: "Hem", icon: Home },
  { path: "/daily-todo", label: "Dagslista", icon: ListTodo },
  { path: "/day-schedule", label: "Dagschema", icon: CalendarClock },
  { path: "/tasks", label: "Uppgifter", icon: CheckSquare },
  { path: "/projects", label: "Projekt", icon: FolderKanban },
  { path: "/notes", label: "Anteckningar", icon: StickyNote },
  { path: "/cars", label: "Bilar", icon: Car },
  { path: "/jobs", label: "Jobb", icon: Briefcase },
  { path: "/shifts", label: "Skift", icon: Clock },
  { path: "/calendar", label: "Kalender", icon: Calendar },
  { path: "/workouts", label: "Träning", icon: Dumbbell },
  { path: "/stocks", label: "Aktier", icon: LineChart },
  { path: "/business", label: "Business", icon: TrendingUp },
  { path: "/statistics", label: "Statistik", icon: BarChart },
  { path: "/settings", label: "Inställningar", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const collapsed = state === "collapsed";

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.path)}
                    isActive={isActive(item.path)}
                    tooltip={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Logga ut">
              <LogOut className="h-4 w-4" />
              <span>Logga ut</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
