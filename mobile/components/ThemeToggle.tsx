import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "nativewind";
import { useThemeStore } from "../stores/theme.store";

export function ThemeToggle() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const { setPreference } = useThemeStore();
  const isDark = colorScheme === "dark";

  function toggle() {
    const next = isDark ? "light" : "dark";
    setColorScheme(next);
    setPreference(next);
  }

  return (
    <TouchableOpacity onPress={toggle} className="mr-3 p-1">
      <Ionicons
        name={isDark ? "sunny-outline" : "moon-outline"}
        size={20}
        color={isDark ? "#F9FAFB" : "#374151"}
      />
    </TouchableOpacity>
  );
}
