import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColorScheme } from "nativewind";
import { router } from "expo-router";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { authService } from "../../services/auth.service";
import { useAuthStore } from "../../stores/auth.store";
import { getErrorMessage } from "../../services/api";

type Mode = "employee" | "staff";

const TW_LOGO_LIGHT = "https://companieslogo.com/img/orig/TWKS_BIG-d4217dff.png?t=1720244494";
const TW_LOGO_DARK  = "https://companieslogo.com/img/orig/TWKS_BIG.D-ba8036ba.png?t=1720244494";

export default function LoginScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [mode, setMode] = useState<Mode>("employee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Validation", "Please enter email and password.");
      return;
    }
    setIsLoading(true);
    try {
      const result =
        mode === "employee"
          ? await authService.signin(email.trim(), password)
          : await authService.login(email.trim(), password);
      await login(result.token, result.role, result.userId);
      if (result.role === "ADMIN") router.replace("/(admin)/slots");
      else if (result.role === "EMPLOYEE") router.replace("/(employee)/available");
      else if (result.role === "SECURITY") router.replace("/(security)/report");
      else router.replace("/(auth)/login");
    } catch (err) {
      Alert.alert("Login Failed", getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-gray-900"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="items-center mb-10">
          <View className="w-16 h-16 rounded-2xl bg-primary items-center justify-center mb-4">
            <Text className="text-white text-3xl font-bold">S</Text>
          </View>
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">Slotify</Text>
          <Text className="text-gray-500 dark:text-gray-400 mt-1">Parking Management</Text>
        </View>

        {/* Toggle */}
        <View className="flex-row bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-8">
          {(["employee", "staff"] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              className={`flex-1 py-2 rounded-lg items-center ${mode === m ? "bg-white dark:bg-gray-700 shadow-sm" : ""}`}
            >
              <Text
                className={`font-medium capitalize ${mode === m ? "text-primary" : "text-gray-500 dark:text-gray-400"}`}
              >
                {m === "employee" ? "Employee" : "Staff"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@company.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Input label="Password" value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

        <Button title={mode === "employee" ? "Sign In" : "Login"} onPress={handleLogin} isLoading={isLoading} className="mt-2" />

        {mode === "employee" && (
          <TouchableOpacity className="mt-4 items-center" onPress={() => router.push("/(auth)/register")}>
            <Text className="text-primary text-sm">
              New employee? <Text className="font-semibold">Register here</Text>
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity className="mt-3 items-center" onPress={() => router.push("/(auth)/forgot-password")}>
          <Text className="text-gray-500 dark:text-gray-400 text-sm">Forgot password?</Text>
        </TouchableOpacity>

        {/* Thoughtworks branding */}
        <View className="items-center mt-12">
          <Text className="text-gray-400 dark:text-gray-600 text-xs mb-2">Powered by</Text>
          <Image
            source={{ uri: isDark ? TW_LOGO_DARK : TW_LOGO_LIGHT }}
            style={{ width: 140, height: 22 }}
            resizeMode="contain"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
