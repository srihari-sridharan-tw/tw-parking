import { useEffect } from "react";
import { router, useSegments } from "expo-router";
import { useAuthStore } from "../stores/auth.store";
import type { Role } from "../types/api";

/** Redirect to login if unauthenticated; optionally enforce a specific role. */
export function useProtectedRoute(requiredRole?: Role) {
  const { token, role, isInitialized } = useAuthStore();
  const segments = useSegments();

  useEffect(() => {
    if (!isInitialized) return;
    // If Expo Router has already navigated to the auth group (e.g. the logout
    // handler already called router.replace), skip the redirect so we don't
    // reset the login form a second time.
    if (segments[0] === "(auth)") return;
    if (!token) {
      router.replace("/(auth)/login");
      return;
    }
    if (requiredRole && role !== requiredRole) {
      router.replace("/(auth)/login");
    }
  }, [token, role, isInitialized, requiredRole, segments]);
}
