import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { StockTag } from "@/hooks/useStocks";

export function TagList({ tags, onEdit }: { tags: StockTag[]; onEdit?: () => void }) {
  return (
    <div className="flex flex-wrap gap-1 items-center">
      {tags.map((g) => (
        <Badge key={g.id} style={{ backgroundColor: g.color }} className="text-white border-0">
          {g.name}
        </Badge>
      ))}
      {onEdit && (
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={onEdit} aria-label="Redigera taggar">
          <Pencil className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}

export function TagPicker({
  tags,
  value,
  onChange,
}: {
  tags: StockTag[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((g) => {
        const on = value.includes(g.id);
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => onChange(on ? value.filter((x) => x !== g.id) : [...value, g.id])}
            className={`px-2 py-1 rounded-full text-xs border-2 ${on ? "text-white" : ""}`}
            style={{ borderColor: g.color, backgroundColor: on ? g.color : "transparent" }}
          >
            {g.name}
          </button>
        );
      })}
      {!tags.length && <span className="text-xs text-muted-foreground">Skapa taggar via "Taggar"-knappen</span>}
    </div>
  );
}
