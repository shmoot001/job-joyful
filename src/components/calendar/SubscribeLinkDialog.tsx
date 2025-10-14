import { useState } from "react";
import { Copy, Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function SubscribeLinkDialog() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const [calendarUrl, setCalendarUrl] = useState<string>("");

  const generateCalendarUrl = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const url = `https://sypmwbybrcuxmnouzjwu.supabase.co/functions/v1/calendar-feed?user_id=${user.id}`;
      setCalendarUrl(url);
    }
  };

  const handleCopy = async () => {
    if (!calendarUrl) {
      await generateCalendarUrl();
    }
    
    const urlToCopy = calendarUrl || await (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user ? `https://sypmwbybrcuxmnouzjwu.supabase.co/functions/v1/calendar-feed?user_id=${user.id}` : '';
    })();

    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      toast({
        title: "Kopierad!",
        description: "Kalender-URL:en har kopierats till urklipp",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte kopiera URL:en",
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && !calendarUrl) {
      generateCalendarUrl();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Link2 className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Prenumerationslänk</span>
          <span className="sm:hidden">Länk</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Prenumerera på din kalender</DialogTitle>
          <DialogDescription>
            Kopiera länken nedan och lägg till den i din kalenderapp (Google Calendar, Apple Calendar, Outlook, etc.)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="calendar-url">Kalender-URL</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="calendar-url"
                value={calendarUrl}
                readOnly
                className="flex-1 font-mono text-xs"
                placeholder="Genererar URL..."
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopy}
                disabled={!calendarUrl}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
            <p className="font-semibold">Så här lägger du till i:</p>
            <div className="space-y-2 text-muted-foreground">
              <p><strong>Google Calendar:</strong> Inställningar → Lägg till kalender → Från URL</p>
              <p><strong>Apple Calendar:</strong> Arkiv → Ny kalenderprenumeration</p>
              <p><strong>Outlook:</strong> Lägg till kalender → Från internet</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}