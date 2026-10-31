import { useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { parseDayPlan } from "@/data/exercises";
import type { ProgramDay, WorkoutProgram } from "@/hooks/useWorkoutPrograms";
import { ExerciseImage } from "./ExerciseImage";

const NAME_PRESETS = ["Push/Pull/Ben", "Övre/Nedre", "Helkropp", "Bro split", "Styrka", "Hypertrofi", "Deload"];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const SHORT_DAYS = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];

/** Compact Mon–Sun strip of a program's focus per day. */
export const ProgramWeekPreview = ({ days }: { days: ProgramDay[] }) => (
  <div className="grid grid-cols-7 gap-1">
    {WEEK_ORDER.map((dow) => {
      const d = days.find((x) => x.day_of_week === dow);
      const exercises = d ? parseDayPlan(d.exercises).plan.exercises : [];
      return (
        <div key={dow} className="rounded bg-muted/60 p-1 text-center min-w-0">
          <p className="text-[10px] text-muted-foreground">{SHORT_DAYS[dow]}</p>
          {d?.is_rest_day ? (
            <p className="text-[10px] font-medium">Vila</p>
          ) : exercises.length > 0 ? (
            <>
              <ExerciseImage exerciseId={exercises[0].exerciseId} className="h-6 w-6 rounded-full mx-auto my-0.5" />
              <p className="text-[10px] font-medium truncate" title={d?.body_part ?? ""}>
                {d?.body_part || `${exercises.length} övn`}
              </p>
            </>
          ) : d?.body_part ? (
            <p className="text-[10px] font-medium truncate">{d.body_part}</p>
          ) : (
            <p className="text-[10px] text-muted-foreground">–</p>
          )}
        </div>
      );
    })}
  </div>
);

export const SaveProgramDialog = ({
  days,
  onClose,
  onSave,
  isSaving,
}: {
  days: ProgramDay[];
  onClose: () => void;
  onSave: (name: string) => void;
  isSaving: boolean;
}) => {
  const [name, setName] = useState("");

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Spara veckan som program</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <ProgramWeekPreview days={days} />
          <div className="space-y-2">
            <Label>Namn</Label>
            <div className="flex flex-wrap gap-2">
              {NAME_PRESETS.map((p) => (
                <Button
                  key={p}
                  type="button"
                  size="sm"
                  variant={name === p ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setName(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
            <Input placeholder="…eller eget namn" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Avbryt
          </Button>
          <Button
            disabled={!name.trim() || isSaving}
            onClick={() => {
              onSave(name.trim());
              onClose();
            }}
          >
            Spara program
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const ApplyProgramDialog = ({
  weekStart,
  weekHasPlan,
  programs,
  onApply,
  onDelete,
  onClose,
}: {
  weekStart: Date;
  weekHasPlan: boolean;
  programs: WorkoutProgram[];
  onApply: (program: WorkoutProgram) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = programs.find((p) => p.id === selectedId);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Använd program – vecka från {format(weekStart, "d MMM", { locale: sv })}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
          {programs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Inga sparade program än. Planera en vecka och tryck på "Spara som program".
            </p>
          )}
          {programs.map((p) => (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedId(p.id)}
              onKeyDown={(e) => e.key === "Enter" && setSelectedId(p.id)}
              className={cn(
                "rounded-lg border p-3 space-y-2 cursor-pointer transition-all hover:bg-muted/40",
                selectedId === p.id && "ring-2 ring-primary border-primary"
              )}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">{p.name}</p>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  aria-label="Ta bort program"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Ta bort programmet "${p.name}"?`)) {
                      onDelete(p.id);
                      if (selectedId === p.id) setSelectedId(null);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <ProgramWeekPreview days={p.days} />
            </div>
          ))}
        </div>

        {weekHasPlan && selected && (
          <p className="text-xs text-amber-600">Veckans nuvarande planering ersätts av programmet.</p>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Avbryt
          </Button>
          <Button
            disabled={!selected}
            onClick={() => {
              if (selected) onApply(selected);
              onClose();
            }}
          >
            Använd program
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
