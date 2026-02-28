import {
  Alert,
  FlatList,
  Modal,
  Platform,
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
import { usersService } from "../../services/users.service";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";
import { getErrorMessage } from "../../services/api";
import type { User } from "../../types/api";

const ROLE_COLORS: Record<User["role"], { bg: string; text: string }> = {
  ADMIN: { bg: "#EFF6FF", text: "#1D4ED8" },
  SECURITY: { bg: "#F0FDF4", text: "#15803D" },
  EMPLOYEE: { bg: "#FFF7ED", text: "#C2410C" },
};

const ROLE_LABELS: Record<User["role"], string> = {
  ADMIN: "Admin",
  SECURITY: "Security",
  EMPLOYEE: "Employee",
};

export default function UsersScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { data: users, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["users"],
    queryFn: usersService.listUsers,
  });

  const clearMutation = useMutation({
    mutationFn: usersService.clearEmployees,
    onSuccess: () => {
      setModalVisible(false);
      setPassword("");
      setPasswordError("");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["report"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
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

  const employeeCount = users?.filter((u) => u.role === "EMPLOYEE").length ?? 0;

  function handleClearEmployees() {
    if (employeeCount === 0) {
      Alert.alert("No Employees", "There are no employee accounts to clear.");
      return;
    }
    setPassword("");
    setPasswordError("");
    setModalVisible(true);
  }

  function handleConfirm() {
    if (!password.trim()) {
      setPasswordError("Password is required.");
      return;
    }
    clearMutation.mutate(password);
  }

  function handleCancel() {
    setModalVisible(false);
    setPassword("");
    setPasswordError("");
  }

  if (isLoading) return <LoadingScreen />;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 pb-24"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListHeaderComponent={
          employeeCount > 0 ? (
            <TouchableOpacity
              onPress={handleClearEmployees}
              disabled={clearMutation.isPending}
              className="flex-row items-center justify-center gap-2 bg-red-500 rounded-2xl py-3 mb-4"
            >
              <Ionicons name="trash-outline" size={18} color="white" />
              <Text className="text-white font-semibold">
                {`Clear All Employees (${employeeCount})`}
              </Text>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            message="No users found"
            subtitle="Registered users will appear here"
          />
        }
        renderItem={({ item }) => {
          const colors = ROLE_COLORS[item.role];
          return (
            <View className="bg-white dark:bg-gray-900 rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 dark:border-gray-800">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-gray-900 dark:text-white font-semibold text-base flex-1 mr-2" numberOfLines={1}>
                  {item.email}
                </Text>
                <View
                  className="px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: colors.bg }}
                >
                  <Text className="text-xs font-medium" style={{ color: colors.text }}>
                    {ROLE_LABELS[item.role]}
                  </Text>
                </View>
              </View>
              {item.profile && (
                <View className="mt-2 gap-0.5">
                  <Text className="text-gray-500 dark:text-gray-400 text-sm">
                    ID: {item.profile.employeeId}
                  </Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-sm">
                    Vehicle: {item.profile.vehicleId}
                  </Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-sm">
                    Phone: {item.profile.phoneNumber}
                  </Text>
                </View>
              )}
              <Text className="text-gray-400 dark:text-gray-500 text-xs mt-2">
                Joined {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>
          );
        }}
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
              <Ionicons name="warning-outline" size={22} color="#EF4444" />
              <Text className="text-gray-900 dark:text-white text-lg font-bold">
                Confirm Clear
              </Text>
            </View>
            <Text className="text-gray-500 dark:text-gray-400 text-sm mb-5">
              This will permanently remove all {employeeCount} employee account{employeeCount !== 1 ? "s" : ""}, including their check-ins and flags. Enter your password to confirm.
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
                disabled={clearMutation.isPending}
                className="flex-1 py-3 rounded-2xl bg-red-500 items-center"
              >
                <Text className="text-white font-semibold">
                  {clearMutation.isPending ? "Clearing..." : "Clear All"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
