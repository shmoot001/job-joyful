import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { exerciseImageUrl, getExercise } from "@/data/exercises";

interface ExerciseImageProps {
  exerciseId: string;
  /** Which image (0 = start position, 1 = end position) */
  index?: number;
  className?: string;
}

export const ExerciseImage = ({ exerciseId, index = 0, className }: ExerciseImageProps) => {
  const [failed, setFailed] = useState(false);
  const exercise = getExercise(exerciseId);
  const path = exercise?.images[index] ?? exercise?.images[0];

  if (!path || failed) {
    return (
      <div className={cn("flex items-center justify-center bg-muted text-muted-foreground", className)}>
        <Dumbbell className="h-1/3 w-1/3 max-h-8 max-w-8" />
      </div>
    );
  }

  return (
    <img
      src={exerciseImageUrl(path)}
      alt={exercise?.name ?? ""}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-cover bg-muted", className)}
    />
  );
};
