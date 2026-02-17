"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/Card";
import { Badge } from "@/shared/components/ui/Badge";
import { Calendar, Video, Clock } from "lucide-react";
import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  workingGroup?: string;
  color?: string;
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
    }>;
  };
}

interface MeetingsResponse {
  success: boolean;
  data: {
    events: CalendarEvent[];
    totalCount: number;
    lastUpdated: string;
  };
}

async function fetchMeetings(): Promise<MeetingsResponse> {
  const res = await fetch("/api/calendar/meetings?limit=5");
  if (!res.ok) throw new Error("Failed to fetch meetings");
  return res.json();
}

function formatMeetingDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) {
    return `Today at ${format(date, "h:mm a")}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow at ${format(date, "h:mm a")}`;
  }
  return format(date, "EEE, MMM d 'at' h:mm a");
}

function MeetingCard({ event }: { event: CalendarEvent }) {
  const meetLink = event.conferenceData?.entryPoints?.find(
    (ep) => ep.entryPointType === "video"
  )?.uri;

  return (
    <div className="p-3 rounded-lg bg-muted/50 border border-border hover:border-ens-blue/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{event.summary}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatMeetingDate(event.start)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {event.workingGroup && (
            <Badge variant="ens" className="text-xs">
              {event.workingGroup}
            </Badge>
          )}
          {meetLink && (
            <a
              href={meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded bg-ens-blue/10 text-ens-blue hover:bg-ens-blue/20 transition-colors"
            >
              <Video className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function UpcomingMeetings() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["meetings"],
    queryFn: fetchMeetings,
    refetchInterval: 300000, // 5 minutes
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-ens-purple" />
          <CardTitle>Upcoming Meetings</CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Unable to load meetings
          </div>
        )}

        {data && (!data.data?.events || data.data.events.length === 0) && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No upcoming meetings
          </div>
        )}

        {data && data.data?.events?.length > 0 && (
          <div className="space-y-2">
            {data.data.events.map((event) => (
              <MeetingCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
