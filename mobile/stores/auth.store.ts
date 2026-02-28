import { create } from "zustand";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { Role } from "../types/api";

const STORE_KEY = "slotify_auth";

// expo-secure-store is native-only; fall back to localStorage on web.
async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof localStorage !== "undefined"
      ? localStorage.getItem(key)
      : null;
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

interface StoredAuth {
  token: string;
  role: Role;
  userId: string;
}

interface AuthState {
  token: string | null;
  userId: string | null;
  role: Role | null;
  isInitialized: boolean;
  login: (token: string, role: Role, userId: string) => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  role: null,
  isInitialized: false,

  login: async (token, role, userId) => {
    const data: StoredAuth = { token, role, userId };
    await storageSet(STORE_KEY, JSON.stringify(data));
    set({ token, role, userId });
  },

  logout: () => {
    // Clear in-memory state synchronously so the UI reacts immediately,
    // then clean up persistent storage in the background.
    set({ token: null, role: null, userId: null });
    storageDelete(STORE_KEY).catch(() => {});
  },

  initialize: async () => {
    try {
      const raw = await storageGet(STORE_KEY);
      if (raw) {
        const { token, role, userId } = JSON.parse(raw) as StoredAuth;
        set({ token, role, userId });
      }
    } catch {
      // corrupted storage — clear it
      await storageDelete(STORE_KEY);
    } finally {
      set({ isInitialized: true });
    }
  },
}));
