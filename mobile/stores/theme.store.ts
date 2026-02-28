import { create } from "zustand";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export type ThemePreference = "light" | "dark" | "system";

const THEME_KEY = "slotify_theme";

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
  }
  return SecureStore.getItemAsync(key);
}

async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function storageDelete(key: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

interface ThemeState {
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: "system",

  setPreference: async (pref) => {
    set({ preference: pref });
    if (pref === "system") {
      await storageDelete(THEME_KEY);
    } else {
      await storageSet(THEME_KEY, pref);
    }
  },

  initialize: async () => {
    try {
      const stored = await storageGet(THEME_KEY);
      if (stored === "light" || stored === "dark") {
        set({ preference: stored });
      }
    } catch {
      // ignore corrupted storage
    }
  },
}));
