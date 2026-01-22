"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  type UserSettings,
  type RefreshIntervals,
  type NotificationSettings,
  DEFAULT_SETTINGS,
} from "@/shared/types/settings";

interface SettingsStore extends UserSettings {
  // Actions
  setTheme: (theme: UserSettings["theme"]) => void;
  setRefreshInterval: <K extends keyof RefreshIntervals>(
    key: K,
    value: RefreshIntervals[K]
  ) => void;
  setNotification: <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => void;
  addFavoriteMultisig: (address: string) => void;
  removeFavoriteMultisig: (address: string) => void;
  toggleFavoriteMultisig: (address: string) => void;
  isFavoriteMultisig: (address: string) => boolean;
  resetSettings: () => void;
}

export const useSettings = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // Initial state from defaults
      ...DEFAULT_SETTINGS,

      // Theme actions
      setTheme: (theme) => set({ theme }),

      // Refresh interval actions
      setRefreshInterval: (key, value) =>
        set((state) => ({
          refreshIntervals: {
            ...state.refreshIntervals,
            [key]: value,
          },
        })),

      // Notification actions
      setNotification: (key, value) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            [key]: value,
          },
        })),

      // Favorite multisig actions
      addFavoriteMultisig: (address) =>
        set((state) => {
          const normalizedAddress = address.toLowerCase();
          if (state.favoriteMultisigs.includes(normalizedAddress)) {
            return state;
          }
          return {
            favoriteMultisigs: [...state.favoriteMultisigs, normalizedAddress],
          };
        }),

      removeFavoriteMultisig: (address) =>
        set((state) => ({
          favoriteMultisigs: state.favoriteMultisigs.filter(
            (a) => a.toLowerCase() !== address.toLowerCase()
          ),
        })),

      toggleFavoriteMultisig: (address) => {
        const normalizedAddress = address.toLowerCase();
        const isFavorite = get().favoriteMultisigs.includes(normalizedAddress);
        if (isFavorite) {
          get().removeFavoriteMultisig(address);
        } else {
          get().addFavoriteMultisig(address);
        }
      },

      isFavoriteMultisig: (address) =>
        get().favoriteMultisigs.includes(address.toLowerCase()),

      // Reset to defaults
      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: "ens-pulse-settings",
      storage: createJSONStorage(() => localStorage),
      // Only persist specific fields, not actions
      partialize: (state) => ({
        theme: state.theme,
        refreshIntervals: state.refreshIntervals,
        notifications: state.notifications,
        favoriteMultisigs: state.favoriteMultisigs,
      }),
    }
  )
);

/**
 * Hook to get a specific refresh interval
 */
export function useRefreshInterval(key: keyof RefreshIntervals): number {
  return useSettings((state) => state.refreshIntervals[key]);
}

/**
 * Hook to get theme preference
 */
export function useTheme(): UserSettings["theme"] {
  return useSettings((state) => state.theme);
}

/**
 * Hook to check if a multisig is favorited
 */
export function useIsFavoriteMultisig(address: string): boolean {
  return useSettings((state) =>
    state.favoriteMultisigs.includes(address.toLowerCase())
  );
}
