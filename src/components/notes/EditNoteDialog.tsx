import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useNotes, Note } from "@/hooks/useNotes";
import { Trash2 } from "lucide-react";

const COLORS = [
  { name: "Yellow", value: "#FBBF24" },
  { name: "Pink", value: "#EC4899" },
  { name: "Purple", value: "#A855F7" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Orange", value: "#F97316" },
];

interface EditNoteDialogProps {
  note: Note | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditNoteDialog = ({ note, open, onOpenChange }: EditNoteDialogProps) => {
  const { updateNote, deleteNote, isUpdating, isDeleting } = useNotes();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState(COLORS[0].value);

  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setContent(note.content);
      setColor(note.color);
    }
  }, [note]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!note || !content.trim()) return;

    updateNote(
      {
        id: note.id,
        title: title.trim() || undefined,
        content: content.trim(),
        color,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  const handleDelete = () => {
    if (!note) return;
    
    if (window.confirm("Är du säker på att du vill ta bort denna anteckning?")) {
      deleteNote(note.id, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    }
  };

  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redigera anteckning</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Titel (valfritt)</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titel..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-content">Innehåll</Label>
            <Textarea
              id="edit-content"
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
          <div className="flex justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? "Tar bort..." : "Ta bort"}
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>
              <Button type="submit" disabled={isUpdating || !content.trim()}>
                {isUpdating ? "Sparar..." : "Spara"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
