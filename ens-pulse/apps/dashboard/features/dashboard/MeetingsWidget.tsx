"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  Widget,
  WidgetHeader,
  WidgetTitle,
  WidgetContent,
} from "@/shared/components/widgets";
import { useUpcomingMeetings } from "@/shared/hooks/use-api-data";

/* ═══════════════════════════════════════════════════════════════════════════
   MEETINGS WIDGET
   ═══════════════════════════════════════════════════════════════════════════ */

export function MeetingsWidget() {
  const { data, isLoading } = useUpcomingMeetings();

  const meetings = data?.meetings || [];

  return (
    <Widget tooltip="Upcoming governance and community meetings.">
      <WidgetHeader>
        <WidgetTitle>CALENDAR</WidgetTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-tertiary)]">Next 30 days</span>
          <Link
            href="https://calendar.google.com/calendar/embed?src=8im77u2b3euav0qjc067qb00ic%40group.calendar.google.com"
            target="_blank"
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </WidgetHeader>
      <WidgetContent padding="sm">
        {isLoading ? (
          <div className="h-32 flex items-center justify-center text-[var(--color-text-muted)]">Loading...</div>
        ) : meetings.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-sm text-[var(--color-text-muted)]">
            No upcoming meetings
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border-subtle)]">
                  <th className="text-left py-1.5 font-medium">Date</th>
                  <th className="text-right py-1.5 font-medium">Time (EST)</th>
                  <th className="text-right py-1.5 font-medium">Meeting</th>
                </tr>
              </thead>
              <tbody>
                {meetings.slice(0, 15).map((meeting: any) => {
                  const date = new Date(meeting.start);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isTomorrow = date.toDateString() === new Date(Date.now() + 86400000).toDateString();
                  const dayLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                  const timeLabel = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

                  return (
                    <tr key={meeting.id} className="border-b border-[var(--color-border-subtle)] last:border-0">
                      <td className="py-1.5 text-[var(--color-text-secondary)]">
                        {dayLabel}
                      </td>
                      <td className="py-1.5 text-right text-[var(--color-text-primary)] tabular-nums">
                        {timeLabel}
                      </td>
                      <td className="py-1.5 text-right text-[var(--color-text-primary)] truncate max-w-[150px]">
                        {meeting.title}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </WidgetContent>
    </Widget>
  );
}

export default MeetingsWidget;
