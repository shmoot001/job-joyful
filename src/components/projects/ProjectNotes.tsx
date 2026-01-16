import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { useProjectDetails, ProjectNote } from "@/hooks/useProjects";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface ProjectNotesProps {
  projectId: string;
}

export function ProjectNotes({ projectId }: ProjectNotesProps) {
  const { notes, createNote, updateNote, deleteNote } = useProjectDetails(projectId);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const handleAdd = () => {
    if (!newContent.trim()) return;
    createNote({
      project_id: projectId,
      title: newTitle.trim() || undefined,
      content: newContent.trim(),
    });
    setNewTitle("");
    setNewContent("");
    setIsAdding(false);
  };

  const startEdit = (note: ProjectNote) => {
    setEditingId(note.id);
    setEditTitle(note.title || "");
    setEditContent(note.content);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editContent.trim()) return;
    updateNote({
      id: editingId,
      title: editTitle.trim() || undefined,
      content: editContent.trim(),
    });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Anteckningar & Plan</h3>
        {!isAdding && (
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ny anteckning
          </Button>
        )}
      </div>

      {isAdding && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Input
              placeholder="Titel (valfritt)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <Textarea
              placeholder="Skriv din anteckning..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} disabled={!newContent.trim()}>
                <Save className="h-4 w-4 mr-2" />
                Spara
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>
                <X className="h-4 w-4 mr-2" />
                Avbryt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {notes?.map((note) => (
          <Card key={note.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                {editingId === note.id ? (
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Titel (valfritt)"
                    className="flex-1"
                  />
                ) : (
                  <CardTitle className="text-base">
                    {note.title || "Utan titel"}
                  </CardTitle>
                )}
                <div className="flex gap-1">
                  {editingId === note.id ? (
                    <>
                      <Button size="icon" variant="ghost" onClick={handleSaveEdit}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => startEdit(note)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteNote(note.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(note.updated_at), "d MMMM yyyy, HH:mm", { locale: sv })}
              </p>
            </CardHeader>
            <CardContent>
              {editingId === note.id ? (
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={4}
                />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              )}
            </CardContent>
          </Card>
        ))}

        {(!notes || notes.length === 0) && !isAdding && (
          <p className="text-center text-muted-foreground py-8">
            Inga anteckningar ännu. Klicka på "Ny anteckning" för att börja.
          </p>
        )}
      </div>
    </div>
  );
}
