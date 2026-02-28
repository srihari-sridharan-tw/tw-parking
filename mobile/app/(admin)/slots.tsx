import {
  Alert,
  FlatList,
  Platform,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import { useState } from "react";
import { useColorScheme } from "nativewind";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { slotsService } from "../../services/slots.service";
import { reportsService } from "../../services/reports.service";
import { Badge } from "../../components/Badge";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";
import { getErrorMessage } from "../../services/api";
import type { Slot } from "../../types/api";

type ViewMode = "list" | "grid";

export default function SlotsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const { data: slots, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["slots"],
    queryFn: slotsService.listSlots,
  });

  const { data: report } = useQuery({
    queryKey: ["report"],
    queryFn: reportsService.getDailyReport,
  });

  const occupiedSlotIds = new Set(
    report?.occupiedSlots.map((s) => s.slotId) ?? []
  );

  const deleteMutation = useMutation({
    mutationFn: slotsService.deleteSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      queryClient.invalidateQueries({ queryKey: ["report"] });
    },
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  function confirmDelete(slot: Slot) {
    if (Platform.OS === "web") {
      if (window.confirm(`Delete slot ${slot.slotCode}? This cannot be undone.`)) {
        deleteMutation.mutate(slot.id);
      }
      return;
    }
    Alert.alert(
      "Delete Slot",
      `Delete slot ${slot.slotCode}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(slot.id),
        },
      ]
    );
  }

  if (isLoading) return <LoadingScreen />;

  const isGrid = viewMode === "grid";

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      {/* View toggle */}
      <View className="flex-row justify-end px-4 pt-3 pb-1">
        <TouchableOpacity
          onPress={() => setViewMode(isGrid ? "list" : "grid")}
          className="p-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
        >
          <Ionicons
            name={isGrid ? "list-outline" : "grid-outline"}
            size={18}
            color={isDark ? "#9CA3AF" : "#6B7280"}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        key={viewMode}
        data={slots}
        keyExtractor={(item) => item.id}
        numColumns={isGrid ? 2 : 1}
        columnWrapperStyle={isGrid ? { gap: 12, paddingHorizontal: 16 } : undefined}
        contentContainerStyle={isGrid ? { paddingTop: 4, paddingBottom: 96 } : undefined}
        contentContainerClassName={isGrid ? undefined : "px-4 pb-24"}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="car-outline"
            message="No parking slots yet"
            subtitle="Tap + to create your first slot"
          />
        }
        renderItem={({ item }) => {
          const isOccupied = occupiedSlotIds.has(item.slotCode);

          if (isGrid) {
            return (
              <View className="flex-1 bg-white dark:bg-gray-900 rounded-2xl p-3 mb-3 shadow-sm border border-gray-100 dark:border-gray-800">
                <View className={`w-12 h-12 rounded-xl items-center justify-center mb-2 self-center ${isOccupied ? "bg-red-50" : "bg-primary/10"}`}>
                  <Ionicons
                    name="car-outline"
                    size={22}
                    color={isOccupied ? "#EF4444" : "#3B82F6"}
                  />
                </View>
                <Text className="text-gray-900 dark:text-white font-bold text-base text-center">
                  {item.slotCode}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-xs text-center mb-2">
                  Level {item.level}
                </Text>
                <View className="items-center mb-2">
                  <Badge type={item.type} />
                </View>
                {isOccupied && (
                  <View className="bg-red-100 rounded-full px-2 py-0.5 mb-2 items-center self-center">
                    <Text className="text-red-600 text-xs font-medium">Occupied</Text>
                  </View>
                )}
                <View className="flex-row justify-center gap-4 mt-1 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/(admin)/slot-form",
                        params: { slotId: item.id, slotCode: item.slotCode, level: item.level, type: item.type },
                      })
                    }
                    className="p-1.5"
                  >
                    <Ionicons name="pencil-outline" size={17} color={isDark ? "#9CA3AF" : "#6B7280"} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => confirmDelete(item)}
                    disabled={isOccupied}
                    className="p-1.5"
                  >
                    <Ionicons
                      name="trash-outline"
                      size={17}
                      color={isOccupied ? "#D1D5DB" : "#EF4444"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }

          return (
            <View className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 dark:border-gray-800">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 rounded-xl bg-primary/10 items-center justify-center">
                    <Text className="text-primary font-bold text-base">
                      {item.slotCode}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-gray-900 dark:text-white font-semibold text-base">
                      {item.slotCode}
                    </Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">
                      Level {item.level}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-2">
                  <Badge type={item.type} />
                  {isOccupied && (
                    <View className="bg-red-100 px-2 py-0.5 rounded-full">
                      <Text className="text-red-600 text-xs font-medium">Occupied</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: "/(admin)/slot-form",
                        params: { slotId: item.id, slotCode: item.slotCode, level: item.level, type: item.type },
                      })
                    }
                    className="p-2"
                  >
                    <Ionicons name="pencil-outline" size={18} color={isDark ? "#9CA3AF" : "#6B7280"} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => confirmDelete(item)}
                    disabled={isOccupied}
                    className="p-2"
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={isOccupied ? "#D1D5DB" : "#EF4444"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push("/(admin)/slot-form")}
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
