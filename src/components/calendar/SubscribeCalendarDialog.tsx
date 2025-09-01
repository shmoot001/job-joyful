import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Link, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubscribeCalendarDialogProps {
  onSubscribe?: (url: string, name: string) => void;
}

const SubscribeCalendarDialog = ({ onSubscribe }: SubscribeCalendarDialogProps) => {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: "Fel",
        description: "Vänligen ange en kalender-URL",
        variant: "destructive",
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: "Fel", 
        description: "Vänligen ange ett namn för kalendern",
        variant: "destructive",
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast({
        title: "Fel",
        description: "Ogiltig URL-format",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Call the onSubscribe callback if provided
      onSubscribe?.(url, name);
      
      toast({
        title: "Prenumeration tillagd",
        description: `Kalendern "${name}" har lagts till`,
      });
      
      // Reset form and close dialog
      setUrl("");
      setName("");
      setOpen(false);
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte lägga till kalenderprenumeration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Prenumerera på kalender</span>
          <span className="sm:hidden">Prenumerera</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Prenumerera på kalender</span>
          </DialogTitle>
          <DialogDescription>
            Lägg till en extern kalender genom att ange iCal-länken. Du kan hitta dessa i Google Kalender, Outlook eller andra kalendertjänster.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="calendar-name">Kalendernamn</Label>
            <Input
              id="calendar-name"
              placeholder="t.ex. Min arbetsschemma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="calendar-url" className="flex items-center space-x-2">
              <Link className="h-4 w-4" />
              <span>iCal URL</span>
            </Label>
            <Input
              id="calendar-url"
              type="url"
              placeholder="https://calendar.google.com/calendar/ical/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              URL:en ska sluta med .ics eller innehålla iCal-data
            </p>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Lägger till..." : "Lägg till"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubscribeCalendarDialog;