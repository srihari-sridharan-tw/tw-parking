import { Text, View } from "react-native";
import type { SlotType } from "../types/api";

type BadgeType =
  | SlotType
  | "available"
  | "occupied"
  | "unresolved"
  | "resolved";

const badgeConfig: Record<BadgeType, { bg: string; text: string; label: string }> = {
  TWO_WHEELER: {
    bg: "bg-amber-100 dark:bg-amber-900/40",
    text: "text-amber-700 dark:text-amber-300",
    label: "🏍️",
  },
  FOUR_WHEELER: {
    bg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-700 dark:text-blue-300",
    label: "🚗",
  },
  available: {
    bg: "bg-green-100 dark:bg-green-900/40",
    text: "text-green-700 dark:text-green-300",
    label: "Available",
  },
  occupied: {
    bg: "bg-red-100 dark:bg-red-900/40",
    text: "text-red-700 dark:text-red-300",
    label: "Occupied",
  },
  unresolved: {
    bg: "bg-orange-100 dark:bg-orange-900/40",
    text: "text-orange-700 dark:text-orange-300",
    label: "Flagged",
  },
  resolved: {
    bg: "bg-gray-100 dark:bg-gray-700",
    text: "text-gray-600 dark:text-gray-300",
    label: "Resolved",
  },
};

interface BadgeProps {
  type: BadgeType;
  customLabel?: string;
}

export function Badge({ type, customLabel }: BadgeProps) {
  const { bg, text, label } = badgeConfig[type];
  return (
    <View className={`${bg} rounded-full px-2 py-0.5`}>
      <Text className={`${text} text-base`}>
        {customLabel ?? label}
      </Text>
    </View>
  );
}
