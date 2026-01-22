import { NextResponse } from "next/server";
import { fetchAllUpcomingMeetings, groupEventsByDay } from "@/shared/lib/calendar/client";
import type { CalendarKey } from "@/shared/config/calendars";

export const revalidate = 300; // 5 minute cache

// Valid calendar keys for validation
const VALID_CALENDAR_KEYS = ["METAGOV", "ECOSYSTEM", "PUBLIC_GOODS", "ENS_DAO_MAIN"] as const;

function isValidCalendarKey(value: string | null): value is CalendarKey {
  return value !== null && VALID_CALENDAR_KEYS.includes(value as CalendarKey);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const calendarParam = searchParams.get("calendar");
    const limitParam = searchParams.get("limit");

    // Validate calendar parameter
    const calendarKey = isValidCalendarKey(calendarParam) ? calendarParam : null;

    // Validate limit parameter (clamp to reasonable range)
    const limit = Math.min(Math.max(parseInt(limitParam || "20", 10) || 20, 1), 100);

    let events = await fetchAllUpcomingMeetings();

    // Filter by calendar if specified
    if (calendarKey) {
      events = events.filter((event) => event.calendarKey === calendarKey);
    }

    // Apply limit
    events = events.slice(0, limit);

    const groupedByDay = groupEventsByDay(events);

    // Deduplicate events by ID
    const uniqueEvents = events.filter((event, index, self) =>
      index === self.findIndex(e => e.id === event.id)
    );

    return NextResponse.json({
      success: true,
      data: {
        meetings: uniqueEvents.map(e => ({
          id: e.id,
          title: e.summary,
          start: e.start,
          end: e.end,
          workingGroup: e.workingGroup,
          meetLink: e.description?.match(/https:\/\/meet\.google\.com\/[^\s]+/)?.[0],
          description: e.description,
        })),
        totalCount: uniqueEvents.length,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch meetings" },
      { status: 500 }
    );
  }
}
