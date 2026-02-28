import { useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColorScheme } from "nativewind";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { flagsService } from "../../services/flags.service";
import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";
import { getErrorMessage } from "../../services/api";
import type { Flag } from "../../types/api";

export default function FlagsScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [filter, setFilter] = useState<"all" | "unresolved">("unresolved");
  const queryClient = useQueryClient();

  const { data: flags, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["flags", filter],
    queryFn: () =>
      filter === "unresolved"
        ? flagsService.listFlags(false)
        : flagsService.listFlags(),
  });

  const resolveMutation = useMutation({
    mutationFn: flagsService.resolveFlag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flags"] });
      queryClient.invalidateQueries({ queryKey: ["flags-security"] });
    },
    onError: (err) => Alert.alert("Error", getErrorMessage(err)),
  });

  function confirmResolve(flag: Flag) {
    const message = `Mark the flag for slot ${flag.slot.slotCode} (vehicle ${flag.vehicleId}) as resolved?`;
    if (Platform.OS === "web") {
      if (window.confirm(message)) resolveMutation.mutate(flag.id);
      return;
    }
    Alert.alert("Resolve Flag", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Resolve", onPress: () => resolveMutation.mutate(flag.id) },
    ]);
  }

  if (isLoading) return <LoadingScreen />;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      {/* Filter toggle */}
      <View className="flex-row bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-2">
        {(["unresolved", "all"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            className={`mr-3 py-1 px-3 rounded-full ${filter === f ? "bg-primary" : "bg-gray-100 dark:bg-gray-800"}`}
          >
            <Text
              className={`text-sm font-medium capitalize ${filter === f ? "text-white" : "text-gray-600 dark:text-gray-300"}`}
            >
              {f === "unresolved" ? "Unresolved" : "All"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={flags}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 pb-8"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-done-outline"
            message="No flags to review"
          />
        }
        renderItem={({ item }) => (
          <Card className="mb-3">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <View className="flex-row items-center gap-2 mb-1">
                  <Text className="font-semibold text-gray-900 dark:text-white">
                    Slot {item.slot.slotCode}
                  </Text>
                  <Badge
                    type={item.resolvedAt ? "resolved" : "unresolved"}
                  />
                </View>
                <Text className="text-gray-600 dark:text-gray-300 text-sm">
                  Vehicle: <Text className="font-medium">{item.vehicleId}</Text>
                </Text>
                <Text className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                  Reported by {item.reportedBy.email} •{" "}
                  {new Date(item.reportedAt).toLocaleString()}
                </Text>
                {item.resolvedAt ? (
                  <Text className="text-gray-400 dark:text-gray-500 text-xs">
                    Resolved {new Date(item.resolvedAt).toLocaleString()}
                  </Text>
                ) : null}
              </View>
              {!item.resolvedAt && (
                <TouchableOpacity
                  onPress={() => confirmResolve(item)}
                  disabled={resolveMutation.isPending}
                  className="ml-3 bg-success/10 rounded-xl px-3 py-2"
                >
                  <Text className="text-success text-sm font-medium">
                    Resolve
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        )}
      />
    </View>
  );
}
