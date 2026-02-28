import {
  Alert,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColorScheme } from "nativewind";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { checkinsService } from "../../services/checkins.service";
import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { EmptyState } from "../../components/EmptyState";
import { LoadingScreen } from "../../components/LoadingScreen";
import { getErrorMessage } from "../../services/api";
import type { CheckIn } from "../../types/api";

function CheckInCard({
  item,
  onCheckOut,
  isLoading,
}: {
  item: CheckIn;
  onCheckOut?: () => void;
  isLoading?: boolean;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const isActive = !item.checkedOutAt;

  return (
    <Card className={`mb-3 ${isActive ? "border-primary/30" : ""}`}>
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center gap-3 flex-1">
          <View
            className={`w-10 h-10 rounded-xl items-center justify-center ${isActive ? "bg-primary/10" : "bg-gray-100 dark:bg-gray-800"}`}
          >
            <Ionicons
              name={isActive ? "car" : "car-outline"}
              size={20}
              color={isActive ? "#3B82F6" : isDark ? "#6B7280" : "#9CA3AF"}
            />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="font-semibold text-gray-900 dark:text-white">
                {item.slot.slotCode}
              </Text>
              <Badge type={isActive ? "occupied" : "resolved"} customLabel={isActive ? "Active" : "Done"} />
            </View>
            <Text className="text-gray-500 dark:text-gray-400 text-sm">
              Vehicle: {item.vehicleId}
            </Text>
            <Text className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">
              In: {new Date(item.checkedInAt).toLocaleString()}
            </Text>
            {item.checkedOutAt && (
              <Text className="text-gray-400 dark:text-gray-500 text-xs">
                Out: {new Date(item.checkedOutAt).toLocaleString()}
              </Text>
            )}
          </View>
        </View>
        {isActive && onCheckOut && (
          <TouchableOpacity
            onPress={onCheckOut}
            disabled={isLoading}
            className="bg-danger/10 px-3 py-2 rounded-xl ml-2"
          >
            <Text className="text-danger font-semibold text-sm">
              Check Out
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}

export default function MyCheckInsScreen() {
  const queryClient = useQueryClient();

  const { data: checkIns, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["my-checkins"],
    queryFn: checkinsService.myCheckIns,
  });

  const checkOutMutation = useMutation({
    mutationFn: checkinsService.checkOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-checkins"] });
      queryClient.invalidateQueries({ queryKey: ["available-slots"] });
    },
    onError: (err) => Alert.alert("Check-Out Failed", getErrorMessage(err)),
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-950">
      <FlatList
        data={checkIns}
        keyExtractor={(item) => item.id}
        contentContainerClassName="p-4 pb-8"
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="time-outline"
            message="No check-ins yet"
            subtitle="Go to Available Slots to check in"
          />
        }
        renderItem={({ item }) => (
          <CheckInCard
            item={item}
            onCheckOut={
              !item.checkedOutAt
                ? () => checkOutMutation.mutate(item.id)
                : undefined
            }
            isLoading={checkOutMutation.isPending}
          />
        )}
      />
    </View>
  );
}
