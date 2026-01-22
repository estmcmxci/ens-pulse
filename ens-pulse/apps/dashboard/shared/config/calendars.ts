// ENS Working Group Google Calendar IDs
// All WGs use a single unified calendar
const ENS_DAO_CALENDAR_ID = "c_80ea023eeeca9390f772def6c89378aa5539432cbea5b16884f1979c68623e30@group.calendar.google.com";
const UNIFIED_CALENDAR = process.env.ENS_DAO_CALENDAR_ID || ENS_DAO_CALENDAR_ID;

export const WG_CALENDARS = {
  METAGOV: UNIFIED_CALENDAR,
  ECOSYSTEM: UNIFIED_CALENDAR,
  PUBLIC_GOODS: UNIFIED_CALENDAR,
  ENS_DAO_MAIN: UNIFIED_CALENDAR,
} as const;

export type CalendarKey = keyof typeof WG_CALENDARS;
export type CalendarId = (typeof WG_CALENDARS)[CalendarKey];

export interface CalendarConfig {
  key: CalendarKey;
  id: CalendarId;
  name: string;
  workingGroup: "Metagov" | "Ecosystem" | "Public Goods" | "DAO";
  color: string;
  description: string;
}

export const CALENDAR_CONFIGS: CalendarConfig[] = [
  {
    key: "METAGOV",
    id: WG_CALENDARS.METAGOV,
    name: "Meta-Governance WG",
    workingGroup: "Metagov",
    color: "#8B5CF6", // Purple
    description: "Meta-Governance Working Group meetings and calls",
  },
  {
    key: "ECOSYSTEM",
    id: WG_CALENDARS.ECOSYSTEM,
    name: "Ecosystem WG",
    workingGroup: "Ecosystem",
    color: "#10B981", // Green
    description: "Ecosystem Working Group meetings and calls",
  },
  {
    key: "PUBLIC_GOODS",
    id: WG_CALENDARS.PUBLIC_GOODS,
    name: "Public Goods WG",
    workingGroup: "Public Goods",
    color: "#F59E0B", // Amber
    description: "Public Goods Working Group meetings and calls",
  },
  {
    key: "ENS_DAO_MAIN",
    id: WG_CALENDARS.ENS_DAO_MAIN,
    name: "ENS DAO",
    workingGroup: "DAO",
    color: "#5298FF", // ENS Blue
    description: "Main ENS DAO governance calls and events",
  },
];

export function getCalendarConfig(key: CalendarKey): CalendarConfig | undefined {
  return CALENDAR_CONFIGS.find((config) => config.key === key);
}

export function getCalendarsByWorkingGroup(
  workingGroup: CalendarConfig["workingGroup"]
): CalendarConfig[] {
  return CALENDAR_CONFIGS.filter((config) => config.workingGroup === workingGroup);
}
