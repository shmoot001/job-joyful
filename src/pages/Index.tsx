import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { LogOut, User } from "lucide-react";

const Index = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Utloggning misslyckades",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Du har loggats ut",
        description: "Tack för att du använde Time Tracker!",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-foreground">Time Tracker</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="h-4 w-4 mr-2" />
                {user?.email}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logga ut</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Välkommen till Time Tracker!</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Hantera dina jobb, arbetspass och uppgifter på ett enkelt sätt.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="text-lg font-semibold mb-2">Jobb & Arbetspass</h3>
              <p className="text-muted-foreground">
                Registrera nya jobb och håll koll på dina arbetspass med kalendervy.
              </p>
            </div>
            
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="text-lg font-semibold mb-2">To-Do Lista</h3>
              <p className="text-muted-foreground">
                Skapa och hantera uppgifter med kategorier och deadlines.
              </p>
            </div>
            
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="text-lg font-semibold mb-2">Dashboard</h3>
              <p className="text-muted-foreground">
                Få en översikt över din lön, arbetade timmar och kommande pass.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
