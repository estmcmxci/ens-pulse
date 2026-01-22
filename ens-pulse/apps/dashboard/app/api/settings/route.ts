import { NextResponse } from "next/server";
import {
  DEFAULT_SETTINGS,
  REFRESH_INTERVAL_OPTIONS,
  THEME_OPTIONS,
} from "@/shared/types/settings";

export const revalidate = 3600; // 1 hour cache (settings rarely change server-side)

/**
 * GET /api/settings
 *
 * Returns default settings and available options.
 * User preferences are stored client-side in localStorage via the useSettings hook.
 * This endpoint provides the schema and defaults for initialization.
 */
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        defaults: DEFAULT_SETTINGS,
        options: {
          themes: THEME_OPTIONS,
          refreshIntervals: REFRESH_INTERVAL_OPTIONS,
        },
        meta: {
          version: "1.0.0",
          storageKey: "ens-pulse-settings",
        },
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}
