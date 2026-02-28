import { Tabs, router } from "expo-router";
import { Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useAuthStore } from "../../stores/auth.store";
import { useProtectedRoute } from "../../hooks/useProtectedRoute";
import { queryClient } from "../../services/queryClient";
import { ThemeToggle } from "../../components/ThemeToggle";

function LogoutButton() {
  const { logout } = useAuthStore();
  return (
    <TouchableOpacity
      onPress={() => {
        logout();
        queryClient.clear();
        router.replace("/(auth)/login");
      }}
      className="mr-4"
    >
      <Text className="text-danger font-medium">Logout</Text>
    </TouchableOpacity>
  );
}

export default function AdminLayout() {
  useProtectedRoute("ADMIN");
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const bg = isDark ? "#111827" : "#ffffff";
  const titleColor = isDark ? "#F9FAFB" : "#111827";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: isDark ? "#6B7280" : "#9CA3AF",
        tabBarStyle: { backgroundColor: bg, borderTopColor: isDark ? "#1F2937" : "#E5E7EB" },
        headerRight: () => (
          <TouchableOpacity className="flex-row items-center">
            <ThemeToggle />
            <LogoutButton />
          </TouchableOpacity>
        ),
        headerStyle: { backgroundColor: bg },
        headerTitleStyle: { fontWeight: "700", color: titleColor },
      }}
    >
      <Tabs.Screen
        name="slots"
        options={{
          title: "Slots",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="slot-form"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: "Report",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="flags"
        options={{
          title: "Flags",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flag-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "Users",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
