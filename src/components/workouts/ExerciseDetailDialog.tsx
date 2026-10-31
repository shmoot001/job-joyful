import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { equipmentLabel, getExercise, muscleGroupLabel } from "@/data/exercises";
import { ExerciseImage } from "./ExerciseImage";

interface ExerciseDetailDialogProps {
  exerciseId: string | null;
  onClose: () => void;
}

export const ExerciseDetailDialog = ({ exerciseId, onClose }: ExerciseDetailDialogProps) => {
  const exercise = exerciseId ? getExercise(exerciseId) : undefined;

  return (
    <Dialog open={!!exercise} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        {exercise && (
          <>
            <DialogHeader>
              <DialogTitle>{exercise.name}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <ExerciseImage exerciseId={exercise.id} index={0} className="w-full aspect-square rounded-md" />
                <p className="text-xs text-muted-foreground text-center mt-1">Start</p>
              </div>
              <div>
                <ExerciseImage exerciseId={exercise.id} index={1} className="w-full aspect-square rounded-md" />
                <p className="text-xs text-muted-foreground text-center mt-1">Slut</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{muscleGroupLabel(exercise.group)}</Badge>
              <Badge variant="secondary">{equipmentLabel(exercise.equipment)}</Badge>
              {exercise.primaryMuscles.map((m) => (
                <Badge key={m} variant="outline" className="capitalize">
                  {m}
                </Badge>
              ))}
            </div>
            <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
              {exercise.instructions.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
