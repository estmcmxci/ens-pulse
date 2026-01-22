/**
 * Calendar Client - Fetches events from Google Calendar API
 * Uses service account authentication for proper recurring event expansion
 */

import { CALENDAR_CONFIGS, type CalendarKey, type CalendarConfig } from "@/shared/config/calendars";

// Service account credentials
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
  "ens-pulse-calendar@calendar-integration-484823.iam.gserviceaccount.com";
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY || "";

// Google Calendar API endpoint
const CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  htmlLink?: string;
  calendarKey?: CalendarKey;
  workingGroup?: CalendarConfig["workingGroup"];
  color?: string;
}

/**
 * Base64url encode a string
 */
function base64urlEncode(str: string): string {
  const base64 = Buffer.from(str).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Create a JWT for Google API authentication
 */
async function createJWT(privateKey: string, clientEmail: string): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600, // 1 hour
  };

  const headerEncoded = base64urlEncode(JSON.stringify(header));
  const payloadEncoded = base64urlEncode(JSON.stringify(payload));
  const signatureInput = `${headerEncoded}.${payloadEncoded}`;

  // Import the private key and sign
  const crypto = await import("crypto");
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signatureInput);
  const signature = sign.sign(privateKey, "base64");
  const signatureEncoded = signature.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return `${signatureInput}.${signatureEncoded}`;
}

/**
 * Get an access token using the service account
 */
async function getAccessToken(): Promise<string | null> {
  // Try to get private key from env or from the JSON file
  let privateKey = PRIVATE_KEY;

  if (!privateKey) {
    try {
      // Try to read from the credentials file
      const fs = await import("fs");
      const path = await import("path");
      const credentialsPath = path.join(process.cwd(), "..", "..", "calendar-integration-484823-9dc4e495e708.json");

      if (fs.existsSync(credentialsPath)) {
        const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
        privateKey = credentials.private_key;
      }
    } catch (e) {
      // Ignore file read errors
    }
  }

  if (!privateKey) {
    console.error("No Google Calendar private key found");
    return null;
  }

  // Handle escaped newlines in the key
  privateKey = privateKey.replace(/\\n/g, "\n");

  try {
    const jwt = await createJWT(privateKey, SERVICE_ACCOUNT_EMAIL);

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to get access token:", error);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
}

/**
 * Fetch calendar events from Google Calendar API
 * This properly expands recurring events
 */
export async function fetchCalendarEvents(
  calendarId: string,
  options: {
    timeMin?: Date;
    timeMax?: Date;
    maxResults?: number;
  } = {}
): Promise<CalendarEvent[]> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    console.error("Failed to get access token, falling back to public ICS");
    return fetchCalendarEventsFromICS(calendarId, options);
  }

  const timeMin = options.timeMin || new Date();
  const timeMax = options.timeMax || new Date(Date.now() + 35 * 24 * 60 * 60 * 1000); // 35 days
  const maxResults = options.maxResults || 50;

  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    maxResults: maxResults.toString(),
    singleEvents: "true", // This expands recurring events!
    orderBy: "startTime",
  });

  try {
    const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Calendar API error:", error);
      return fetchCalendarEventsFromICS(calendarId, options);
    }

    const data = await response.json();
    const events: CalendarEvent[] = (data.items || []).map((item: any) => ({
      id: item.id,
      summary: item.summary || "Untitled Event",
      description: item.description,
      start: item.start?.dateTime || item.start?.date || "",
      end: item.end?.dateTime || item.end?.date || "",
      location: item.location,
      htmlLink: item.htmlLink,
    }));

    return events;
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return fetchCalendarEventsFromICS(calendarId, options);
  }
}

/**
 * Fallback: Fetch calendar events from public ICS feed
 * Note: This doesn't properly expand recurring events
 */
async function fetchCalendarEventsFromICS(
  calendarId: string,
  options: {
    timeMin?: Date;
    timeMax?: Date;
    maxResults?: number;
  } = {}
): Promise<CalendarEvent[]> {
  const icsUrl = `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;

  try {
    const response = await fetch(icsUrl, {
      signal: AbortSignal.timeout(10000),
      headers: {
        Accept: "text/calendar",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch calendar: ${response.status}`);
    }

    const icsContent = await response.text();
    let events = parseICS(icsContent);

    // Filter by time range
    const timeMin = options.timeMin || new Date();
    const timeMax = options.timeMax || new Date(Date.now() + 35 * 24 * 60 * 60 * 1000);

    events = events.filter((event) => {
      const eventStart = new Date(event.start);
      return eventStart >= timeMin && eventStart <= timeMax;
    });

    // Sort by start time
    events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    // Limit results
    if (options.maxResults) {
      events = events.slice(0, options.maxResults);
    }

    return events;
  } catch (error) {
    console.error(`Error fetching calendar ${calendarId}:`, error);
    return [];
  }
}

/**
 * Parse ICS content into calendar events (fallback)
 */
function parseICS(icsContent: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = icsContent.split(/\r?\n/);

  let currentEvent: Partial<CalendarEvent> | null = null;
  let currentKey = "";
  let currentValue = "";

  const parseICSDate = (dateStr: string): string => {
    const cleanDate = dateStr.replace(/^[^:]+:/, "");
    if (cleanDate.length === 8) {
      return `${cleanDate.slice(0, 4)}-${cleanDate.slice(4, 6)}-${cleanDate.slice(6, 8)}T00:00:00Z`;
    }
    if (cleanDate.length >= 15) {
      const year = cleanDate.slice(0, 4);
      const month = cleanDate.slice(4, 6);
      const day = cleanDate.slice(6, 8);
      const hour = cleanDate.slice(9, 11);
      const minute = cleanDate.slice(11, 13);
      const second = cleanDate.slice(13, 15);
      return `${year}-${month}-${day}T${hour}:${minute}:${second}${cleanDate.endsWith("Z") ? "Z" : ""}`;
    }
    return dateStr;
  };

  const decodeICSValue = (value: string): string => {
    return value.replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
  };

  for (const line of lines) {
    if (line.startsWith(" ") || line.startsWith("\t")) {
      currentValue += line.slice(1);
      continue;
    }

    if (currentKey && currentEvent) {
      switch (currentKey) {
        case "UID":
          currentEvent.id = currentValue;
          break;
        case "SUMMARY":
          currentEvent.summary = decodeICSValue(currentValue);
          break;
        case "DESCRIPTION":
          currentEvent.description = decodeICSValue(currentValue);
          break;
        case "LOCATION":
          currentEvent.location = decodeICSValue(currentValue);
          break;
        case "DTSTART":
          currentEvent.start = parseICSDate(currentValue);
          break;
        case "DTEND":
          currentEvent.end = parseICSDate(currentValue);
          break;
      }
    }

    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    currentKey = line.slice(0, colonIndex);
    currentValue = line.slice(colonIndex + 1);

    if (currentKey.startsWith("DTSTART")) currentKey = "DTSTART";
    else if (currentKey.startsWith("DTEND")) currentKey = "DTEND";

    if (line === "BEGIN:VEVENT") {
      currentEvent = {};
    } else if (line === "END:VEVENT" && currentEvent) {
      if (currentKey && currentEvent) {
        switch (currentKey) {
          case "UID":
            currentEvent.id = currentValue;
            break;
          case "SUMMARY":
            currentEvent.summary = decodeICSValue(currentValue);
            break;
          case "DESCRIPTION":
            currentEvent.description = decodeICSValue(currentValue);
            break;
          case "LOCATION":
            currentEvent.location = decodeICSValue(currentValue);
            break;
          case "DTSTART":
            currentEvent.start = parseICSDate(currentValue);
            break;
          case "DTEND":
            currentEvent.end = parseICSDate(currentValue);
            break;
        }
      }

      if (currentEvent.id && currentEvent.summary && currentEvent.start) {
        events.push(currentEvent as CalendarEvent);
      }
      currentEvent = null;
      currentKey = "";
      currentValue = "";
    }
  }

  return events;
}

/**
 * Fetch upcoming meetings for a specific working group
 */
export async function fetchUpcomingMeetings(
  calendarKey: CalendarKey,
  maxResults: number = 10
): Promise<CalendarEvent[]> {
  const config = CALENDAR_CONFIGS.find((c) => c.key === calendarKey);
  if (!config || !config.id) {
    console.warn(`No config found for calendar key: ${calendarKey}`);
    return [];
  }

  const timeMax = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000);
  const events = await fetchCalendarEvents(config.id, { maxResults, timeMax });

  return events.map((event) => ({
    ...event,
    calendarKey,
    workingGroup: config.workingGroup,
    color: config.color,
  }));
}

/**
 * Fetch all upcoming meetings from all working groups
 */
export async function fetchAllUpcomingMeetings(): Promise<CalendarEvent[]> {
  const config = CALENDAR_CONFIGS[0];
  if (!config || !config.id) {
    return [];
  }

  // Fetch events for at least one month into the future
  const timeMax = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000); // 35 days
  const events = await fetchCalendarEvents(config.id, { maxResults: 50, timeMax });

  // Tag events with ENS DAO info
  return events.map((event) => ({
    ...event,
    calendarKey: "ENS_DAO_MAIN" as CalendarKey,
    workingGroup: "DAO" as const,
    color: "#5298FF",
  }));
}

/**
 * Get the next upcoming meeting
 */
export function getNextMeeting(events: CalendarEvent[]): CalendarEvent | null {
  const now = new Date();
  return events.find((event) => new Date(event.start) > now) || null;
}

/**
 * Group events by day for display
 */
export function groupEventsByDay(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  return events.reduce(
    (acc, event) => {
      const date = new Date(event.start).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(event);
      return acc;
    },
    {} as Record<string, CalendarEvent[]>
  );
}
