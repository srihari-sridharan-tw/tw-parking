import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { useColorScheme } from "nativewind";
import { useAuthStore } from "../stores/auth.store";
import { useThemeStore } from "../stores/theme.store";
import { LoadingScreen } from "../components/LoadingScreen";
import { queryClient } from "../services/queryClient";

// Applies the persisted theme preference on startup
function ThemeInitializer() {
  const { setColorScheme } = useColorScheme();
  const { preference, initialize } = useThemeStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    setColorScheme(preference);
  }, [preference]);

  return null;
}

export default function RootLayout() {
  const { isInitialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (!isInitialized) return <LoadingScreen />;

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeInitializer />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(employee)" />
        <Stack.Screen name="(security)" />
      </Stack>
    </QueryClientProvider>
  );
}
