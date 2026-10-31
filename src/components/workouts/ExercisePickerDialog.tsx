import { useMemo, useState } from "react";
import { Check, Info, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { EXERCISES, MUSCLE_GROUPS, equipmentLabel, type MuscleGroup } from "@/data/exercises";
import { ExerciseImage } from "./ExerciseImage";
import { ExerciseDetailDialog } from "./ExerciseDetailDialog";

interface ExercisePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (exerciseIds: string[]) => void;
  /** Already planned for the day – shown as marked */
  alreadyPlanned: string[];
  initialGroup?: MuscleGroup;
}

export const ExercisePickerDialog = ({
  open,
  onClose,
  onAdd,
  alreadyPlanned,
  initialGroup,
}: ExercisePickerDialogProps) => {
  const [group, setGroup] = useState<MuscleGroup | "all">(initialGroup ?? "all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return EXERCISES.filter(
      (e) => (group === "all" || e.group === group) && (!q || e.name.toLowerCase().includes(q))
    );
  }, [group, search]);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleClose = () => {
    setSelected([]);
    setSearch("");
    onClose();
  };

  const handleAdd = () => {
    onAdd(selected);
    handleClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="sm:max-w-[760px] h-[90vh] flex flex-col p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Välj övningar</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 shrink-0">
            {[{ id: "all" as const, label: "Alla" }, ...MUSCLE_GROUPS].map((g) => (
              <Button
                key={g.id}
                size="sm"
                variant={group === g.id ? "default" : "outline"}
                className="shrink-0 rounded-full"
                onClick={() => setGroup(g.id)}
              >
                {g.label}
              </Button>
            ))}
          </div>

          <div className="relative shrink-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök övning (valfritt)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="flex-1 overflow-y-auto -mx-1 px-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map((ex) => {
                const isSelected = selected.includes(ex.id);
                const isPlanned = alreadyPlanned.includes(ex.id);
                return (
                  <div
                    key={ex.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggle(ex.id)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggle(ex.id))}
                    className={cn(
                      "relative rounded-lg border overflow-hidden cursor-pointer transition-all hover:shadow-md text-left",
                      isSelected && "ring-2 ring-primary border-primary"
                    )}
                  >
                    <ExerciseImage exerciseId={ex.id} className="w-full aspect-[4/3]" />
                    {isSelected && (
                      <div className="absolute top-2 left-2 rounded-full bg-primary text-primary-foreground p-1">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                    <button
                      type="button"
                      aria-label="Visa instruktioner"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailId(ex.id);
                      }}
                      className="absolute top-2 right-2 rounded-full bg-background/80 p-1 hover:bg-background"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                    <div className="p-2">
                      <p className="text-xs sm:text-sm font-medium leading-tight line-clamp-2">{ex.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {equipmentLabel(ex.equipment)}
                        {isPlanned && " · redan tillagd"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-8 text-sm">Inga övningar hittades</p>
            )}
          </div>

          <DialogFooter className="shrink-0 flex-row gap-2 sm:justify-between">
            <Button variant="outline" onClick={handleClose} className="flex-1 sm:flex-none">
              Avbryt
            </Button>
            <Button onClick={handleAdd} disabled={selected.length === 0} className="flex-1 sm:flex-none">
              Lägg till {selected.length > 0 && `(${selected.length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ExerciseDetailDialog exerciseId={detailId} onClose={() => setDetailId(null)} />
    </>
  );
};
