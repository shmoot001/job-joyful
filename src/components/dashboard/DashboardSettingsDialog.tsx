import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings, ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
import { WidgetConfig, WidgetId } from "@/hooks/useDashboardSettings";

interface DashboardSettingsDialogProps {
  widgets: WidgetConfig[];
  onToggle: (id: WidgetId) => void;
  onMove: (id: WidgetId, direction: "up" | "down") => void;
  onReset: () => void;
}

export const DashboardSettingsDialog = ({
  widgets,
  onToggle,
  onMove,
  onReset,
}: DashboardSettingsDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Anpassa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Anpassa Dashboard</DialogTitle>
          <DialogDescription>
            Välj vilka widgets som ska visas och ändra ordningen
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-[400px] overflow-y-auto py-4">
          {widgets.map((widget, index) => (
            <div
              key={widget.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex items-center gap-3">
                <Switch
                  checked={widget.visible}
                  onCheckedChange={() => onToggle(widget.id)}
                />
                <span className={widget.visible ? "text-foreground" : "text-muted-foreground"}>
                  {widget.name}
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onMove(widget.id, "up")}
                  disabled={index === 0}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onMove(widget.id, "down")}
                  disabled={index === widgets.length - 1}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Återställ standard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
