import { Text, TextInput, View, type TextInputProps } from "react-native";
import { useColorScheme } from "nativewind";

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
}

export function Input({ label, error, ...props }: InputProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{label}</Text>
      <TextInput
        {...props}
        className={`border rounded-xl px-4 py-3 text-base text-gray-900 dark:text-white bg-white dark:bg-gray-800 ${
          error ? "border-danger" : "border-gray-300 dark:border-gray-600"
        }`}
        placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
      />
      {error ? (
        <Text className="text-danger text-xs mt-1">{error}</Text>
      ) : null}
    </View>
  );
}
