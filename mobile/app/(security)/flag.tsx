import { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColorScheme } from "nativewind";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { slotsService } from "../../services/slots.service";
import { reportsService } from "../../services/reports.service";
import { flagsService } from "../../services/flags.service";
import { LoadingScreen } from "../../components/LoadingScreen";
import { getErrorMessage } from "../../services/api";
import type { Slot } from "../../types/api";

export default function FlagSlotScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const queryClient = useQueryClient();
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [vehicleId, setVehicleId] = useState("");
  const [vehicleIdError, setVehicleIdError] = useState("");

  const {
    data: slots,
    isLoading: slotsLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["all-slots-security"],
    queryFn: slotsService.listSlots,
    refetchInterval: 30_000,
  });

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ["report"],
    queryFn: reportsService.getDailyReport,
    refetchInterval: 30_000,
  });

  const { data: flags, isLoading: flagsLoading } = useQuery({
    queryKey: ["flags-security"],
    queryFn: () => flagsService.listFlags(false), // unresolved only
    refetchInterval: 30_000,
  });

  const flagMutation = useMutation({
    mutationFn: () =>
      flagsService.createFlag(
        selectedSlot!.id,
        vehicleId.trim().toUpperCase()
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report"] });
      queryClient.invalidateQueries({ queryKey: ["flags-security"] });
      setSelectedSlot(null);
      setVehicleId("");
      setVehicleIdError("");
      Alert.alert(
        "Flag Submitted",
        "The admin has been notified about the unauthorised vehicle."
      );
    },
    onError: (err) => Alert.alert("Flag Failed", getErrorMessage(err)),
  });

  // slotCode → vehicleNumber for occupied slots
  const occupiedMap = new Map(
    report?.occupiedSlots.map((s) => [s.slotId, s.vehicleNumber]) ?? []
  );

  // slotCode → flagged vehicleId for unresolved flagged slots
  const flaggedMap = new Map(
    flags?.map((f) => [f.slot.slotCode, f.vehicleId]) ?? []
  );

  function openFlagModal(slot: Slot) {
    setSelectedSlot(slot);
    setVehicleId("");
    setVehicleIdError("");
  }

  function handleSubmit() {
    if (!vehicleId.trim()) {
      setVehicleIdError("Please enter the vehicle number.");
      return;
    }
    setVehicleIdError("");
    flagMutation.mutate();
  }

  if (slotsLoading || reportLoading || flagsLoading) return <LoadingScreen />;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <FlatList
        data={slots ?? []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerClassName="px-3 pt-3 pb-8"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListHeaderComponent={
          <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1 mb-4 px-1">
            <View className="flex-row items-center gap-1.5">
              <View className="w-3 h-3 rounded-full bg-green-400" />
              <Text className="text-xs text-gray-500 dark:text-gray-400">Empty — tap to flag</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="w-3 h-3 rounded-full bg-red-400" />
              <Text className="text-xs text-gray-500 dark:text-gray-400">Occupied</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="w-3 h-3 rounded-full bg-amber-400" />
              <Text className="text-xs text-gray-500 dark:text-gray-400">Flagged</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const vehicleNumber = occupiedMap.get(item.slotCode);
          const flaggedVehicle = flaggedMap.get(item.slotCode);
          const isOccupied = Boolean(vehicleNumber);
          const isFlagged = Boolean(flaggedVehicle);
          const isDisabled = isOccupied || isFlagged;

          const tileStyle = isOccupied
            ? "bg-red-50 dark:bg-red-900/20 border-red-200"
            : isFlagged
            ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300"
            : "bg-white dark:bg-gray-900 border-green-200";

          const iconBg = isOccupied
            ? "bg-red-100 dark:bg-red-900/20"
            : isFlagged
            ? "bg-amber-100 dark:bg-amber-900/20"
            : "bg-green-50 dark:bg-green-900/20";

          const iconColor = isOccupied
            ? "#EF4444"
            : isFlagged
            ? "#F59E0B"
            : "#22C55E";

          const iconName = isOccupied
            ? "car"
            : isFlagged
            ? "alert-circle"
            : "car-outline";

          const codeColor = isOccupied
            ? "text-red-700 dark:text-red-400"
            : isFlagged
            ? "text-amber-700 dark:text-amber-400"
            : "text-gray-900 dark:text-white";

          return (
            <TouchableOpacity
              onPress={() => !isDisabled && openFlagModal(item)}
              disabled={isDisabled}
              activeOpacity={isDisabled ? 1 : 0.7}
              className={`flex-1 m-1.5 rounded-2xl p-3 border-2 items-center ${tileStyle}`}
            >
              {/* Icon */}
              <View
                className={`w-10 h-10 rounded-xl items-center justify-center mb-2 ${iconBg}`}
              >
                <Ionicons name={iconName} size={20} color={iconColor} />
              </View>

              {/* Slot code */}
              <Text className={`font-bold text-sm ${codeColor}`}>
                {item.slotCode}
              </Text>

              {/* Level · type */}
              <Text className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">
                Lvl {item.level} · {item.type === "TWO_WHEELER" ? "2W" : "4W"}
              </Text>

              {/* Status */}
              <View className="mt-2 min-h-[32px] items-center justify-center">
                {isOccupied ? (
                  <Text
                    className="text-red-500 text-xs font-semibold text-center"
                    numberOfLines={1}
                  >
                    {vehicleNumber}
                  </Text>
                ) : isFlagged ? (
                  <>
                    <Text
                      className="text-amber-600 text-xs font-semibold text-center"
                      numberOfLines={1}
                    >
                      {flaggedVehicle}
                    </Text>
                    <Text className="text-amber-500 text-xs font-medium">
                      Flagged
                    </Text>
                  </>
                ) : (
                  <Text className="text-green-500 text-xs font-medium">
                    Empty
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Flag bottom sheet modal */}
      <Modal
        visible={Boolean(selectedSlot)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedSlot(null)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <View className="bg-white dark:bg-gray-900 rounded-t-3xl px-6 pt-5 pb-10">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-xl bg-warning/10 items-center justify-center">
                  <Ionicons name="alert-circle" size={18} color="#F59E0B" />
                </View>
                <Text className="text-lg font-bold text-gray-900 dark:text-white">
                  Flag Slot {selectedSlot?.slotCode}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedSlot(null)}
                className="p-1"
              >
                <Ionicons name="close" size={22} color={isDark ? "#6B7280" : "#9CA3AF"} />
              </TouchableOpacity>
            </View>

            <Text className="text-sm text-gray-400 dark:text-gray-500 mb-5">
              Lvl {selectedSlot?.level} ·{" "}
              {selectedSlot?.type === "TWO_WHEELER" ? "2-Wheeler" : "4-Wheeler"}
            </Text>

            <Text className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Unauthorised Vehicle Number
            </Text>
            <TextInput
              value={vehicleId}
              onChangeText={(t) => {
                setVehicleId(t);
                setVehicleIdError("");
              }}
              placeholder="e.g. KA01AB1234"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
              autoFocus
              className={`border rounded-xl px-4 py-3 text-gray-900 dark:text-white text-base ${
                vehicleIdError ? "border-red-400 bg-red-50 dark:bg-red-900/20" : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              }`}
            />
            {vehicleIdError ? (
              <Text className="text-red-500 text-xs mt-1 mb-4">
                {vehicleIdError}
              </Text>
            ) : (
              <View className="mb-4" />
            )}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={flagMutation.isPending}
              className="bg-warning rounded-2xl py-4 items-center"
            >
              <Text className="text-white font-bold text-base">
                {flagMutation.isPending ? "Submitting..." : "Submit Flag"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
