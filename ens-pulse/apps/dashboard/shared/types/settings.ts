/**
 * User settings types for ENS Pulse dashboard
 */

export interface RefreshIntervals {
  /** Treasury data refresh interval in milliseconds */
  treasury: number;
  /** Governance data refresh interval in milliseconds */
  governance: number;
  /** Market data refresh interval in milliseconds */
  market: number;
}

export interface NotificationSettings {
  /** Enable notifications for new proposals */
  proposals: boolean;
  /** Enable notifications for treasury pending transactions */
  treasury: boolean;
}

export interface UserSettings {
  /** Theme preference */
  theme: "light" | "dark" | "system";
  /** Data refresh intervals */
  refreshIntervals: RefreshIntervals;
  /** Notification preferences */
  notifications: NotificationSettings;
  /** Favorite multisig addresses for quick access */
  favoriteMultisigs: string[];
}

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: UserSettings = {
  theme: "system",
  refreshIntervals: {
    treasury: 300000,   // 5 minutes
    governance: 300000, // 5 minutes
    market: 300000,     // 5 minutes
  },
  notifications: {
    proposals: true,
    treasury: false,
  },
  favoriteMultisigs: [],
};

/**
 * Refresh interval presets for UI selection
 */
export const REFRESH_INTERVAL_OPTIONS = [
  { label: "30 seconds", value: 30000 },
  { label: "1 minute", value: 60000 },
  { label: "2 minutes", value: 120000 },
  { label: "5 minutes", value: 300000 },
  { label: "15 minutes", value: 900000 },
  { label: "30 minutes", value: 1800000 },
] as const;

/**
 * Theme options for UI selection
 */
export const THEME_OPTIONS = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
] as const;
