import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useNotes } from "@/hooks/useNotes";

const COLORS = [
  { name: "Yellow", value: "#FBBF24" },
  { name: "Pink", value: "#EC4899" },
  { name: "Purple", value: "#A855F7" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Orange", value: "#F97316" },
];

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddNoteDialog = ({ open, onOpenChange }: AddNoteDialogProps) => {
  const { createNote, isCreating } = useNotes();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState(COLORS[0].value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;

    createNote(
      {
        title: title.trim() || undefined,
        content: content.trim(),
        color,
      },
      {
        onSuccess: () => {
          setTitle("");
          setContent("");
          setColor(COLORS[0].value);
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ny anteckning</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel (valfritt)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titel..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Innehåll</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Skriv din anteckning här..."
              className="min-h-[150px]"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Färg</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c.value,
                    borderColor: color === c.value ? "hsl(var(--primary))" : "transparent",
                  }}
                  title={c.name}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button type="submit" disabled={isCreating || !content.trim()}>
              {isCreating ? "Sparar..." : "Spara"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
