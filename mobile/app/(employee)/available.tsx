import {
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useState } from "react";
import { useColorScheme } from "nativewind";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { slotsService } from "../../services/slots.service";
import { checkinsService } from "../../services/checkins.service";
import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";
import { getErrorMessage } from "../../services/api";

type ViewMode = "list" | "grid";

export default function AvailableSlotsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const { data: availableSlots, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["available-slots"],
    queryFn: slotsService.getAvailableSlots,
    refetchInterval: 30_000,
  });

  const { data: myCheckIns } = useQuery({
    queryKey: ["my-checkins"],
    queryFn: checkinsService.myCheckIns,
  });

  const activeCheckIn = myCheckIns?.find((c) => !c.checkedOutAt) ?? null;

  const checkInMutation = useMutation({
    mutationFn: checkinsService.checkIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["available-slots"] });
      queryClient.invalidateQueries({ queryKey: ["my-checkins"] });
    },
    onError: (err) => Alert.alert("Check-In Failed", getErrorMessage(err)),
  });

  const checkOutMutation = useMutation({
    mutationFn: checkinsService.checkOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["available-slots"] });
      queryClient.invalidateQueries({ queryKey: ["my-checkins"] });
    },
    onError: (err) => Alert.alert("Check-Out Failed", getErrorMessage(err)),
  });

  if (isLoading) return <LoadingScreen />;

  const isGrid = viewMode === "grid";

  const activeCheckInBanner = activeCheckIn ? (
    <Card className="mb-4 border-primary/30 bg-blue-50 dark:bg-blue-900/20">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-primary font-semibold text-base">
            Checked In — {activeCheckIn.slot.slotCode}
          </Text>
          <Text className="text-blue-400 text-sm">
            Vehicle: {activeCheckIn.vehicleId}
          </Text>
          <Text className="text-blue-400 text-xs">
            Since {new Date(activeCheckIn.checkedInAt).toLocaleTimeString()}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => checkOutMutation.mutate(activeCheckIn.id)}
          disabled={checkOutMutation.isPending}
          className="bg-danger/10 px-4 py-2 rounded-xl"
        >
          <Text className="text-danger font-semibold">Check Out</Text>
        </TouchableOpacity>
      </View>
    </Card>
  ) : null;

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
        data={availableSlots}
        keyExtractor={(item) => item.id}
        numColumns={isGrid ? 2 : 1}
        columnWrapperStyle={isGrid ? { gap: 12, paddingHorizontal: 16 } : undefined}
        contentContainerStyle={isGrid ? { paddingTop: 4, paddingBottom: 32 } : undefined}
        contentContainerClassName={isGrid ? undefined : "px-4 pb-8"}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListHeaderComponent={
          isGrid ? (
            activeCheckIn ? (
              <View className="px-4 mb-4">{activeCheckInBanner}</View>
            ) : null
          ) : (
            activeCheckInBanner
          )
        }
        ListEmptyComponent={
          <EmptyState
            icon="car-sport-outline"
            message="No available slots"
            subtitle="All slots are currently occupied. Pull to refresh."
          />
        }
        renderItem={({ item }) => {
          if (isGrid) {
            return (
              <View className="flex-1 bg-white dark:bg-gray-900 rounded-2xl p-3 mb-3 shadow-sm border border-gray-100 dark:border-gray-800 items-center">
                <View className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 items-center justify-center mb-2">
                  <Ionicons name="location" size={22} color="#22C55E" />
                </View>
                <Text className="font-bold text-gray-900 dark:text-white text-base">
                  {item.slotCode}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-xs mb-2">
                  Level {item.level}
                </Text>
                <View className="mb-3">
                  <Badge type={item.type} />
                </View>
                <TouchableOpacity
                  onPress={() => checkInMutation.mutate(item.id)}
                  disabled={checkInMutation.isPending || Boolean(activeCheckIn)}
                  className={`w-full py-2 rounded-xl items-center ${activeCheckIn ? "bg-gray-100 dark:bg-gray-800" : "bg-primary"}`}
                >
                  <Text
                    className={`font-semibold text-xs ${activeCheckIn ? "text-gray-400 dark:text-gray-500" : "text-white"}`}
                  >
                    Check In
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <Card className="mb-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 items-center justify-center">
                    <Ionicons name="location" size={22} color="#22C55E" />
                  </View>
                  <View>
                    <Text className="font-semibold text-gray-900 dark:text-white text-base">
                      {item.slotCode}
                    </Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">
                      Level {item.level}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-2">
                  <Badge type={item.type} />
                  <TouchableOpacity
                    onPress={() => checkInMutation.mutate(item.id)}
                    disabled={checkInMutation.isPending || Boolean(activeCheckIn)}
                    className={`px-4 py-2 rounded-xl ${activeCheckIn ? "bg-gray-100 dark:bg-gray-800" : "bg-primary"}`}
                  >
                    <Text
                      className={`font-semibold text-sm ${activeCheckIn ? "text-gray-400 dark:text-gray-500" : "text-white"}`}
                    >
                      Check In
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          );
        }}
      />
    </View>
  );
}
