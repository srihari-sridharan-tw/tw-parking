import { Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  message: string;
  subtitle?: string;
}

export function EmptyState({
  icon = "folder-open-outline",
  message,
  subtitle,
}: EmptyStateProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  return (
    <View className="flex-1 items-center justify-center py-16">
      <Ionicons name={icon} size={48} color={isDark ? "#4B5563" : "#D1D5DB"} />
      <Text className="text-gray-500 dark:text-gray-400 text-base font-medium mt-3">{message}</Text>
      {subtitle ? (
        <Text className="text-gray-400 dark:text-gray-500 text-sm mt-1 text-center px-8">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
