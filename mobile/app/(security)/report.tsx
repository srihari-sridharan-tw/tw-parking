// Security's daily report view — same data as admin, read-only
// Re-uses the same query and layout pattern

import { FlatList, RefreshControl, Text, View } from "react-native";
import { useColorScheme } from "nativewind";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { reportsService } from "../../services/reports.service";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View className="flex-1 bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
      <Ionicons name={icon} size={24} color={color} />
      <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</Text>
      <Text className="text-gray-500 dark:text-gray-400 text-sm">{label}</Text>
    </View>
  );
}

export default function SecurityReportScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { data: report, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["report"],
    queryFn: reportsService.getDailyReport,
    refetchInterval: 60_000,
  });

  if (isLoading) return <LoadingScreen />;
  if (!report) return null;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <FlatList
        data={report.occupiedSlots}
        keyExtractor={(item) => item.slotId}
        contentContainerClassName="p-4 pb-8"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListHeaderComponent={
          <>
            <View className="flex-row gap-3 mb-4">
              <StatCard
                label="Total"
                value={report.totalSlots}
                color="#3B82F6"
                icon="layers-outline"
              />
              <StatCard
                label="Used"
                value={report.usedSlots}
                color="#EF4444"
                icon="car-outline"
              />
              <StatCard
                label="Empty"
                value={report.emptySlots}
                color="#22C55E"
                icon="checkmark-circle-outline"
              />
            </View>
            <Text className="text-sm text-gray-400 dark:text-gray-500 mb-3">
              Updated {new Date(report.generatedAt).toLocaleTimeString()}
            </Text>
            <Text className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Occupied Slots
            </Text>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-circle-outline"
            message="All slots are empty"
          />
        }
        renderItem={({ item }) => (
          <Card className="mb-3">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="font-semibold text-gray-900 dark:text-white">
                  Slot {item.slotId}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">
                  Vehicle: {item.vehicleNumber}
                </Text>
              </View>
              <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center">
                <Ionicons name="car" size={18} color="#EF4444" />
              </View>
            </View>
          </Card>
        )}
      />
    </View>
  );
}
