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
import { useState } from "react";
import { useColorScheme } from "nativewind";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { reportsService } from "../../services/reports.service";
import { checkinsService } from "../../services/checkins.service";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";
import { getErrorMessage } from "../../services/api";

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

export default function ReportScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { data: report, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["report"],
    queryFn: reportsService.getDailyReport,
    refetchInterval: 60_000,
  });

  const freeUpMutation = useMutation({
    mutationFn: checkinsService.forceCheckoutAll,
    onSuccess: () => {
      setModalVisible(false);
      setPassword("");
      setPasswordError("");
      queryClient.invalidateQueries({ queryKey: ["report"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      queryClient.invalidateQueries({ queryKey: ["available-slots"] });
    },
    onError: (err) => {
      const msg = getErrorMessage(err);
      if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("incorrect")) {
        setPasswordError("Incorrect password. Please try again.");
      } else {
        setModalVisible(false);
        setPassword("");
        setPasswordError("");
        Alert.alert("Error", msg);
      }
    },
  });

  function handleFreeUp() {
    setPassword("");
    setPasswordError("");
    setModalVisible(true);
  }

  function handleConfirm() {
    if (!password.trim()) {
      setPasswordError("Password is required.");
      return;
    }
    freeUpMutation.mutate(password);
  }

  function handleCancel() {
    setModalVisible(false);
    setPassword("");
    setPasswordError("");
  }

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
            {/* Summary Cards */}
            <View className="flex-row gap-3 mb-4">
              <StatCard
                label="Total Slots"
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

            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-sm text-gray-400 dark:text-gray-500">
                Updated {new Date(report.generatedAt).toLocaleTimeString()}
              </Text>
              {report.usedSlots > 0 && (
                <TouchableOpacity
                  onPress={handleFreeUp}
                  disabled={freeUpMutation.isPending}
                  className="flex-row items-center gap-1 bg-red-500 px-3 py-1.5 rounded-full"
                >
                  <Ionicons name="flash-outline" size={14} color="white" />
                  <Text className="text-white text-xs font-semibold">
                    {freeUpMutation.isPending ? "Clearing..." : "Free Up!"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <Text className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Occupied Slots
            </Text>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-circle-outline"
            message="All slots are empty"
            subtitle="No active check-ins right now"
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

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-gray-900 rounded-t-3xl px-6 pt-6 pb-10">
            <View className="flex-row items-center gap-3 mb-2">
              <Ionicons name="flash-outline" size={22} color="#EF4444" />
              <Text className="text-gray-900 dark:text-white text-lg font-bold">
                Confirm Free Up
              </Text>
            </View>
            <Text className="text-gray-500 dark:text-gray-400 text-sm mb-5">
              This will force check out all {report.usedSlots} occupied slot{report.usedSlots !== 1 ? "s" : ""}. Enter your password to confirm.
            </Text>

            <Text className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Your password
            </Text>
            <TextInput
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setPasswordError("");
              }}
              placeholder="Enter your password"
              placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
              secureTextEntry
              autoFocus
              className={`border rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800 mb-1 ${
                passwordError ? "border-red-500" : "border-gray-300 dark:border-gray-600"
              }`}
            />
            {passwordError ? (
              <Text className="text-red-500 text-xs mb-3">{passwordError}</Text>
            ) : (
              <View className="mb-3" />
            )}

            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity
                onPress={handleCancel}
                className="flex-1 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 items-center"
              >
                <Text className="text-gray-700 dark:text-gray-200 font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirm}
                disabled={freeUpMutation.isPending}
                className="flex-1 py-3 rounded-2xl bg-red-500 items-center"
              >
                <Text className="text-white font-semibold">
                  {freeUpMutation.isPending ? "Freeing..." : "Free Up"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
