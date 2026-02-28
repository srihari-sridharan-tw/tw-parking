import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { authService } from "../../services/auth.service";
import { useAuthStore } from "../../stores/auth.store";
import { getErrorMessage } from "../../services/api";

export default function RegisterScreen() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    employeeId: "",
    vehicleId: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const newErrors: Partial<typeof form> = {};
    if (!form.email.includes("@")) newErrors.email = "Valid email required";
    if (form.password.length < 6) newErrors.password = "At least 6 characters";
    if (!form.employeeId.trim()) newErrors.employeeId = "Required";
    if (!form.vehicleId.trim()) newErrors.vehicleId = "Required";
    if (form.phoneNumber.length < 10) newErrors.phoneNumber = "At least 10 digits";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setIsLoading(true);
    try {
      const result = await authService.register({
        email: form.email.trim(),
        password: form.password,
        employeeId: form.employeeId.trim(),
        vehicleId: form.vehicleId.trim().toUpperCase(),
        phoneNumber: form.phoneNumber.trim(),
      });
      await login(result.token, result.role, result.userId);
      router.replace("/(employee)/available");
    } catch (err) {
      Alert.alert("Registration Failed", getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-gray-900"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerClassName="px-6 py-12" keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Text className="text-primary text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Register as Employee
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 mb-8">Create your Slotify account</Text>

        <Input label="Email" value={form.email} onChangeText={(v) => set("email", v)} error={errors.email} placeholder="you@company.com" keyboardType="email-address" autoCapitalize="none" />
        <Input label="Password" value={form.password} onChangeText={(v) => set("password", v)} error={errors.password} placeholder="Min 6 characters" secureTextEntry />
        <Input label="Employee ID" value={form.employeeId} onChangeText={(v) => set("employeeId", v)} error={errors.employeeId} placeholder="e.g. EMP001" autoCapitalize="characters" />
        <Input label="Vehicle ID" value={form.vehicleId} onChangeText={(v) => set("vehicleId", v)} error={errors.vehicleId} placeholder="e.g. KA01AB1234" autoCapitalize="characters" />
        <Input label="Phone Number" value={form.phoneNumber} onChangeText={(v) => set("phoneNumber", v)} error={errors.phoneNumber} placeholder="10-digit mobile number" keyboardType="phone-pad" />

        <Button title="Create Account" onPress={handleRegister} isLoading={isLoading} className="mt-2" />

        <TouchableOpacity className="mt-4 items-center" onPress={() => router.back()}>
          <Text className="text-gray-500 dark:text-gray-400 text-sm">
            Already registered? <Text className="text-primary font-semibold">Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
