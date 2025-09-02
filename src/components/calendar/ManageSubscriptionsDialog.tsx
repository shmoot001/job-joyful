import { useState, useEffect } from "react";
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
import { Settings, Trash2, Edit3, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Subscription {
  id: string;
  name: string;
  url: string;
  data: string;
  createdAt: string;
}

interface ManageSubscriptionsDialogProps {
  onSubscriptionsChange?: () => void;
  deleteShift?: (id: string) => void;
  shifts?: any[];
}

const ManageSubscriptionsDialog = ({ onSubscriptionsChange, deleteShift, shifts }: ManageSubscriptionsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadSubscriptions();
    }
  }, [open]);

  const loadSubscriptions = () => {
    try {
      const subs = JSON.parse(localStorage.getItem('calendarSubscriptions') || '[]');
      setSubscriptions(subs);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    }
  };

  const saveSubscriptions = (newSubscriptions: Subscription[]) => {
    localStorage.setItem('calendarSubscriptions', JSON.stringify(newSubscriptions));
    setSubscriptions(newSubscriptions);
    onSubscriptionsChange?.();
  };

  const handleEdit = (subscription: Subscription) => {
    setEditingId(subscription.id);
    setEditName(subscription.name);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) {
      toast({
        title: "Fel",
        description: "Namnet kan inte vara tomt",
        variant: "destructive",
      });
      return;
    }

    const updatedSubscriptions = subscriptions.map(sub =>
      sub.id === id ? { ...sub, name: editName.trim() } : sub
    );

    saveSubscriptions(updatedSubscriptions);
    setEditingId(null);
    setEditName("");

    toast({
      title: "Uppdaterat",
      description: "Kalendernamnet har uppdaterats",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleDelete = (id: string) => {
    const subscription = subscriptions.find(sub => sub.id === id);
    if (!subscription) return;

    if (window.confirm(`Är du säker på att du vill ta bort kalendern "${subscription.name}"? Detta kommer också att ta bort alla relaterade skift.`)) {
      // Find and delete related shifts
      if (shifts && deleteShift) {
        const relatedShifts = shifts.filter(shift => 
          shift.notes && shift.notes.includes(`(från ${subscription.name})`)
        );
        
        relatedShifts.forEach(shift => {
          deleteShift(shift.id);
        });
      }

      const updatedSubscriptions = subscriptions.filter(sub => sub.id !== id);
      saveSubscriptions(updatedSubscriptions);

      toast({
        title: "Borttagen",
        description: `Kalendern "${subscription.name}" och alla relaterade skift har tagits bort`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-2">
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Hantera prenumerationer</span>
          <span className="sm:hidden">Hantera</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Hantera kalenderprenumerationer</span>
          </DialogTitle>
          <DialogDescription>
            Redigera namn eller ta bort dina kalenderprenumerationer.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {subscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Inga kalenderprenumerationer ännu</p>
            </div>
          ) : (
            subscriptions.map((subscription) => (
              <div key={subscription.id} className="border rounded-lg p-4 space-y-3">
                {editingId === subscription.id ? (
                  <div className="space-y-2">
                    <Label htmlFor={`edit-${subscription.id}`}>Kalendernamn</Label>
                    <Input
                      id={`edit-${subscription.id}`}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Ange nytt namn"
                      autoFocus
                    />
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleSaveEdit(subscription.id)}
                      >
                        Spara
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleCancelEdit}
                      >
                        Avbryt
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{subscription.name}</h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {subscription.url}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Tillagd: {new Date(subscription.createdAt).toLocaleDateString('sv-SE')}
                        </p>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(subscription)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(subscription.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Stäng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageSubscriptionsDialog;