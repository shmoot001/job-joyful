import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useNotes, Note } from "@/hooks/useNotes";
import { AddNoteDialog } from "@/components/notes/AddNoteDialog";
import { EditNoteDialog } from "@/components/notes/EditNoteDialog";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

const Notes = () => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const { notes, isLoading } = useNotes();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Anteckningar</h1>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ny anteckning
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground">Laddar anteckningar...</div>
        ) : notes && notes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {notes.map((note) => (
              <Card
                key={note.id}
                className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                style={{ borderLeftColor: note.color, borderLeftWidth: "4px" }}
                onClick={() => setSelectedNote(note)}
              >
                <div className="p-4">
                  {note.title && (
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{note.title}</h3>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-6 whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                    {format(new Date(note.updated_at), "d MMM yyyy, HH:mm", { locale: sv })}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            <p className="mb-4">Inga anteckningar ännu</p>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Skapa din första anteckning
            </Button>
          </div>
        )}

        <AddNoteDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
        <EditNoteDialog
          note={selectedNote}
          open={!!selectedNote}
          onOpenChange={(open) => !open && setSelectedNote(null)}
        />
      </main>
    </div>
  );
};

export default Notes;
