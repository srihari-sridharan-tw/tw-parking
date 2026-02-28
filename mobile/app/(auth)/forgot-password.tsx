import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { authService } from "../../services/auth.service";
import { getErrorMessage } from "../../services/api";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleForgot() {
    if (!email.trim()) {
      Alert.alert("Validation", "Please enter your email.");
      return;
    }
    setIsSending(true);
    try {
      const res = await authService.forgotPassword(email.trim());
      setSent(true);
      if (res.resetToken) setResetToken(res.resetToken);
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  }

  async function handleReset() {
    const useToken = resetToken ?? token;
    if (!useToken || !newPassword) {
      Alert.alert("Validation", "Please enter reset token and new password.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Validation", "Password must be at least 6 characters.");
      return;
    }
    setIsResetting(true);
    try {
      await authService.resetPassword(useToken, newPassword);
      Alert.alert("Success", "Password updated! Please log in.", [
        { text: "OK", onPress: () => router.replace("/(auth)/login") },
      ]);
    } catch (err) {
      Alert.alert("Error", getErrorMessage(err));
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-gray-900"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerClassName="px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Text className="text-primary text-base">← Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          Reset Password
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 mb-8">
          Enter your email to receive a reset token.
        </Text>

        {!sent ? (
          <>
            <Input label="Email" value={email} onChangeText={setEmail} placeholder="you@company.com" keyboardType="email-address" autoCapitalize="none" />
            <Button title="Send Reset Token" onPress={handleForgot} isLoading={isSending} />
          </>
        ) : (
          <View>
            <View className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl p-4 mb-6">
              <Text className="text-green-700 dark:text-green-300 text-sm">
                A reset token has been generated.
              </Text>
              {resetToken ? (
                <>
                  <Text className="text-green-600 dark:text-green-400 text-xs mt-1">
                    Dev mode — token returned:
                  </Text>
                  <Text selectable className="text-green-800 dark:text-green-200 font-mono text-xs mt-1 break-all">
                    {resetToken}
                  </Text>
                </>
              ) : (
                <Text className="text-green-600 dark:text-green-400 text-xs mt-1">
                  Check your email for the token.
                </Text>
              )}
            </View>
            {!resetToken && (
              <Input label="Reset Token" value={token} onChangeText={setToken} placeholder="Paste token from email" />
            )}
            <Input label="New Password" value={newPassword} onChangeText={setNewPassword} placeholder="Min 6 characters" secureTextEntry />
            <Button title="Update Password" onPress={handleReset} isLoading={isResetting} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
