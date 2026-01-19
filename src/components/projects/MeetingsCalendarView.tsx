import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, MapPin, Link as LinkIcon, Edit, Trash2, CheckCircle2 } from "lucide-react";
import { ProjectMeeting, useProjectExtras } from "@/hooks/useProjectExtras";
import { format, parseISO, isSameDay, isToday, isPast } from "date-fns";
import { sv } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MeetingsCalendarViewProps {
  projectId: string;
  meetings: ProjectMeeting[];
  onEdit: (meeting: ProjectMeeting) => void;
  onDelete: (meeting: ProjectMeeting) => void;
}

export function MeetingsCalendarView({ 
  projectId, 
  meetings, 
  onEdit, 
  onDelete 
}: MeetingsCalendarViewProps) {
  const { updateMeeting } = useProjectExtras(projectId);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const getMeetingsForDate = (date: Date) => {
    return meetings?.filter((m) => isSameDay(parseISO(m.meeting_date), date)) || [];
  };

  const selectedDateMeetings = selectedDate ? getMeetingsForDate(selectedDate) : [];

  const handleToggleDone = (meeting: ProjectMeeting) => {
    updateMeeting({ 
      id: meeting.id, 
      is_done: !meeting.is_done 
    });
  };

  // Function to highlight dates with meetings
  const modifiers = {
    hasMeeting: (date: Date) => {
      return meetings?.some((m) => isSameDay(parseISO(m.meeting_date), date)) || false;
    },
    hasDoneMeeting: (date: Date) => {
      return meetings?.some((m) => 
        isSameDay(parseISO(m.meeting_date), date) && m.is_done
      ) || false;
    },
    hasUpcomingMeeting: (date: Date) => {
      return meetings?.some((m) => 
        isSameDay(parseISO(m.meeting_date), date) && !m.is_done
      ) || false;
    },
  };

  const modifiersStyles = {
    hasMeeting: {
      fontWeight: "bold" as const,
    },
    hasUpcomingMeeting: {
      backgroundColor: "hsl(var(--primary) / 0.1)",
      borderRadius: "4px",
    },
    hasDoneMeeting: {
      backgroundColor: "hsl(var(--muted))",
      borderRadius: "4px",
    },
  };

  return (
    <div className="grid md:grid-cols-[300px,1fr] gap-6">
      {/* Calendar */}
      <Card>
        <CardContent className="p-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={sv}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="w-full"
          />
          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary/10" />
              <span>Kommande möten</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted" />
              <span>Avklarade möten</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meeting list for selected date */}
      <div className="space-y-4">
        <h4 className="font-medium">
          {selectedDate && (
            <>
              {isToday(selectedDate) 
                ? "Dagens möten" 
                : format(selectedDate, "EEEE d MMMM", { locale: sv })}
            </>
          )}
        </h4>

        {selectedDateMeetings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                Inga möten denna dag
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {selectedDateMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onEdit={() => onEdit(meeting)}
                onDelete={() => onDelete(meeting)}
                onToggleDone={() => handleToggleDone(meeting)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MeetingCard({
  meeting,
  onEdit,
  onDelete,
  onToggleDone,
}: {
  meeting: ProjectMeeting;
  onEdit: () => void;
  onDelete: () => void;
  onToggleDone: () => void;
}) {
  const meetingDate = parseISO(meeting.meeting_date);
  const isMeetingToday = isToday(meetingDate);
  const isMeetingPast = isPast(meetingDate) && !isMeetingToday;

  return (
    <Card className={cn(
      meeting.is_done && "border-green-500/50 bg-green-500/5",
      isMeetingPast && !meeting.is_done && "border-amber-500/50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={meeting.is_done}
            onCheckedChange={onToggleDone}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={cn(
                "font-medium truncate",
                meeting.is_done && "line-through text-muted-foreground"
              )}>
                {meeting.title}
              </h4>
              {meeting.is_done && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Klar
                </Badge>
              )}
              {isMeetingToday && !meeting.is_done && (
                <Badge variant="default" className="text-xs">Idag</Badge>
              )}
              {isMeetingPast && !meeting.is_done && (
                <Badge variant="outline" className="text-amber-600 border-amber-600 text-xs">
                  Passerad
                </Badge>
              )}
            </div>

            {meeting.description && (
              <p className={cn(
                "text-sm text-muted-foreground mt-1 line-clamp-2",
                meeting.is_done && "line-through"
              )}>
                {meeting.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
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
