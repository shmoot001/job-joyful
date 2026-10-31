import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Stepper = ({
  label,
  value,
  step,
  min,
  onChange,
  format: fmt = (v) => String(v),
  size = "sm",
}: {
  label?: string;
  value: number;
  step: number;
  min: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  size?: "sm" | "lg";
}) => (
  <div className="flex flex-col items-center gap-1">
    {label && <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>}
    <div className="flex items-center gap-1">
      <Button
        type="button"
        size="icon"
        variant="outline"
        className={cn(size === "lg" ? "h-9 w-9" : "h-7 w-7")}
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span className={cn("text-center font-semibold tabular-nums", size === "lg" ? "w-16 text-base" : "w-12 text-sm")}>{fmt(value)}</span>
      <Button type="button" size="icon" variant="outline" className={cn(size === "lg" ? "h-9 w-9" : "h-7 w-7")} onClick={() => onChange(value + step)}>
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  </div>
);
