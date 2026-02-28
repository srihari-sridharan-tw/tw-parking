import { useEffect } from "react";
import { router, useRootNavigationState } from "expo-router";
import { useAuthStore } from "../stores/auth.store";
import { LoadingScreen } from "../components/LoadingScreen";

export default function Index() {
  const { role, isInitialized } = useAuthStore();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Wait until both the auth store is hydrated AND the root navigator is
    // fully mounted (navigationState.key being set is Expo Router's signal).
    if (!isInitialized || !navigationState?.key) return;

    if (role === "ADMIN") {
      router.replace("/(admin)/slots");
    } else if (role === "EMPLOYEE") {
      router.replace("/(employee)/available");
    } else if (role === "SECURITY") {
      router.replace("/(security)/report");
    } else {
      router.replace("/(auth)/login");
    }
  }, [role, isInitialized, navigationState?.key]);

  return <LoadingScreen />;
}
