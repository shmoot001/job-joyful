import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, CalendarDays, Clock, MapPin, Link as LinkIcon, Trash2, Edit } from "lucide-react";
import { useProjectExtras, ProjectMeeting } from "@/hooks/useProjectExtras";
import { format, parseISO, isPast, isToday } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ProjectMeetingsProps {
  projectId: string;
}

export function ProjectMeetings({ projectId }: ProjectMeetingsProps) {
  const { meetings, isLoadingMeetings, createMeeting, updateMeeting, deleteMeeting, isCreatingMeeting } =
    useProjectExtras(projectId);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<ProjectMeeting | null>(null);
  const [meetingToDelete, setMeetingToDelete] = useState<ProjectMeeting | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingDate, setMeetingDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [location, setLocation] = useState("");
  const [meetingLink, setMeetingLink] = useState("");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setMeetingDate(new Date());
    setStartTime("09:00");
    setEndTime("10:00");
    setLocation("");
    setMeetingLink("");
    setEditingMeeting(null);
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (meeting: ProjectMeeting) => {
    setEditingMeeting(meeting);
    setTitle(meeting.title);
    setDescription(meeting.description || "");
    setMeetingDate(parseISO(meeting.meeting_date));
    setStartTime(meeting.start_time);
    setEndTime(meeting.end_time || "");
    setLocation(meeting.location || "");
    setMeetingLink(meeting.meeting_link || "");
    setIsAddDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!title.trim() || !meetingDate) return;

    const meetingData = {
      project_id: projectId,
      title,
      description: description || undefined,
      meeting_date: format(meetingDate, "yyyy-MM-dd"),
      start_time: startTime,
      end_time: endTime || undefined,
      location: location || undefined,
      meeting_link: meetingLink || undefined,
    };

    if (editingMeeting) {
      updateMeeting({ id: editingMeeting.id, ...meetingData });
    } else {
      createMeeting(meetingData);
    }

    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleDelete = () => {
    if (meetingToDelete) {
      deleteMeeting(meetingToDelete.id);
      setMeetingToDelete(null);
    }
  };

  const upcomingMeetings = meetings?.filter(
    (m) => !isPast(parseISO(m.meeting_date)) || isToday(parseISO(m.meeting_date))
  );
  const pastMeetings = meetings?.filter(
    (m) => isPast(parseISO(m.meeting_date)) && !isToday(parseISO(m.meeting_date))
  );

  if (isLoadingMeetings) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Möten</h3>
        <Button onClick={handleOpenAddDialog} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nytt möte
        </Button>
      </div>

      {/* Upcoming meetings */}
      {upcomingMeetings && upcomingMeetings.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Kommande möten</h4>
          <div className="grid gap-3">
            {upcomingMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onEdit={() => handleOpenEditDialog(meeting)}
                onDelete={() => setMeetingToDelete(meeting)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past meetings */}
      {pastMeetings && pastMeetings.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Tidigare möten</h4>
          <div className="grid gap-3 opacity-60">
            {pastMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onEdit={() => handleOpenEditDialog(meeting)}
                onDelete={() => setMeetingToDelete(meeting)}
                isPast
              />
            ))}
          </div>
        </div>
      )}

      {(!meetings || meetings.length === 0) && (
        <Card>
          <CardContent className="py-8 text-center">
            <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Inga möten planerade</p>
            <Button onClick={handleOpenAddDialog} variant="outline" className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Schemalägg möte
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingMeeting ? "Redigera möte" : "Nytt möte"}</DialogTitle>
            <DialogDescription>
              {editingMeeting ? "Uppdatera mötesdetaljer" : "Schemalägg ett nytt möte för projektet"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Mötets titel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beskrivning</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Agenda eller beskrivning"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Datum *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !meetingDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {meetingDate ? format(meetingDate, "PPP", { locale: sv }) : "Välj datum"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={meetingDate}
                    onSelect={setMeetingDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Starttid *</Label>
                <Input
                  id="start-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">Sluttid</Label>
                <Input
                  id="end-time"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Plats</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Mötesrum, adress, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting-link">Möteslänk</Label>
              <Input
                id="meeting-link"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSubmit} disabled={!title.trim() || !meetingDate || isCreatingMeeting}>
              {isCreatingMeeting ? "Sparar..." : editingMeeting ? "Uppdatera" : "Skapa möte"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!meetingToDelete} onOpenChange={() => setMeetingToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ta bort möte</DialogTitle>
            <DialogDescription>
              Är du säker på att du vill ta bort "{meetingToDelete?.title}"?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMeetingToDelete(null)}>
              Avbryt
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Ta bort
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MeetingCard({
  meeting,
  onEdit,
  onDelete,
  isPast = false,
}: {
  meeting: ProjectMeeting;
  onEdit: () => void;
  onDelete: () => void;
  isPast?: boolean;
}) {
  const meetingDate = parseISO(meeting.meeting_date);
  const isMeetingToday = isToday(meetingDate);

  return (
    <Card className={cn(isPast && "border-muted")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium truncate">{meeting.title}</h4>
              {isMeetingToday && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Idag</span>
              )}
            </div>

            {meeting.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{meeting.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {format(meetingDate, "d MMM yyyy", { locale: sv })}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {meeting.start_time}
                {meeting.end_time && ` - ${meeting.end_time}`}
              </div>
              {meeting.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[150px]">{meeting.location}</span>
                </div>
              )}
              {meeting.meeting_link && (
                <a
                  href={meeting.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  Möteslänk
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
