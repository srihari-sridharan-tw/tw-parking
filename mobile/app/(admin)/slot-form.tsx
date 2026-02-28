import { useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColorScheme } from "nativewind";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { slotsService } from "../../services/slots.service";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { getErrorMessage } from "../../services/api";
import type { SlotType } from "../../types/api";

export default function SlotFormScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const params = useLocalSearchParams<{
    slotId?: string;
    slotCode?: string;
    level?: string;
    type?: string;
  }>();

  const isEdit = Boolean(params.slotId);
  const queryClient = useQueryClient();

  const [slotCode, setSlotCode] = useState(params.slotCode ?? "");
  const [level, setLevel] = useState(params.level ?? "");
  const [type, setType] = useState<SlotType>(
    (params.type as SlotType) ?? "TWO_WHEELER"
  );
  const [errors, setErrors] = useState<{
    slotCode?: string;
    level?: string;
  }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // Re-sync form fields when editing a different slot (component is reused by Tabs navigator)
  useEffect(() => {
    setSlotCode(params.slotCode ?? "");
    setLevel(params.level ?? "");
    setType((params.type as SlotType) ?? "TWO_WHEELER");
    setErrors({});
    setApiError(null);
  }, [params.slotId]);

  const mutation = useMutation({
    mutationFn: () => {
      const data = { slotCode: slotCode.trim().toUpperCase(), level: parseInt(level, 10), type };
      return isEdit
        ? slotsService.updateSlot(params.slotId!, data)
        : slotsService.createSlot(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slots"] });
      queryClient.invalidateQueries({ queryKey: ["report"] });
      router.replace("/(admin)/slots");
    },
    onError: (err) => setApiError(getErrorMessage(err)),
  });

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!/^[A-Z]\d{4}$/.test(slotCode.trim().toUpperCase())) {
      newErrors.slotCode = "Format: one letter + 4 digits (e.g. M4333)";
    }
    if (!level || isNaN(parseInt(level, 10)) || parseInt(level, 10) < 1) {
      newErrors.level = "Level must be a positive number";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit() {
    setApiError(null);
    if (validate()) mutation.mutate();
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-gray-900"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerClassName="px-6 py-8"
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.replace("/(admin)/slots")} className="mb-6">
          <Text className="text-primary text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {isEdit ? "Edit Slot" : "New Slot"}
        </Text>

        <Input
          label="Slot Code"
          value={slotCode}
          onChangeText={setSlotCode}
          error={errors.slotCode}
          placeholder="e.g. M4333"
          autoCapitalize="characters"
          maxLength={5}
        />
        <Input
          label="Level"
          value={level}
          onChangeText={setLevel}
          error={errors.level}
          placeholder="e.g. 1"
          keyboardType="numeric"
        />

        {/* Type selector */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Vehicle Type
        </Text>
        <View className="flex-row gap-3 mb-6">
          {(["TWO_WHEELER", "FOUR_WHEELER"] as SlotType[]).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setType(t)}
              className={`flex-1 py-3 rounded-xl border-2 items-center ${
                type === t
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              }`}
            >
              <Text
                className={`font-medium ${type === t ? "text-primary" : "text-gray-500 dark:text-gray-400"}`}
              >
                {t === "TWO_WHEELER" ? "2-Wheeler" : "4-Wheeler"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {apiError && (
          <View className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl px-4 py-3 mb-4">
            <Text className="text-danger text-sm">{apiError}</Text>
          </View>
        )}

        <Button
          title={isEdit ? "Save Changes" : "Create Slot"}
          onPress={handleSubmit}
          isLoading={mutation.isPending}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
