import { useState } from "react";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { sv } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const CopyDayDialog = ({
  sourceDate,
  onCopy,
  onClose,
}: {
  sourceDate: Date;
  onCopy: (target: Date) => void;
  onClose: () => void;
}) => {
  const [target, setTarget] = useState<Date | undefined>();
  const monday = startOfWeek(sourceDate, { weekStartsOn: 1 });
  const sameWeek = Array.from({ length: 7 }, (_, i) => addDays(monday, i)).filter((d) => !isSameDay(d, sourceDate));
  const nextWeek = addDays(sourceDate, 7);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[420px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kopiera passet till…</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {sameWeek.map((d) => (
              <Button
                key={d.toISOString()}
                size="sm"
                variant={target && isSameDay(target, d) ? "default" : "outline"}
                className="rounded-full capitalize"
                onClick={() => setTarget(d)}
              >
                {format(d, "EEE d/M", { locale: sv })}
              </Button>
            ))}
            <Button
              size="sm"
              variant={target && isSameDay(target, nextWeek) ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setTarget(nextWeek)}
            >
              Samma dag nästa vecka
            </Button>
          </div>

          <Calendar
            mode="single"
            selected={target}
            onSelect={setTarget}
            weekStartsOn={1}
            locale={sv}
            defaultMonth={sourceDate}
            className="rounded-md border mx-auto pointer-events-auto"
          />

          <p className="text-xs text-muted-foreground">
            Om något redan är planerat den dagen ersätts det. Veckan skapas automatiskt om den saknas.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Avbryt
          </Button>
          <Button
            disabled={!target}
            onClick={() => {
              if (target) onCopy(target);
              onClose();
            }}
          >
            {target ? `Kopiera till ${format(target, "d MMM", { locale: sv })}` : "Välj dag"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
