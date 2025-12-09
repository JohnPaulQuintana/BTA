import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

import Constants from "expo-constants";
import PopupMessage from "../../components/PopupMessage"; // your popup component

const API_URL = Constants.expoConfig?.extra?.apiUrl as string;

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"email" | "password">("email");
  const [passwordToken, setPasswordToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [popup, setPopup] = useState<{ visible: boolean; message: string; type: "success" | "error" }>({ visible: false, message: "", type: "success" });

  const showPopup = (message: string, type: "success" | "error") => {
    setPopup({ visible: true, message, type });
    setTimeout(() => setPopup({ ...popup, visible: false }), 3000);
  };

  const handleEmailSubmit = async () => {
    if (!email) {
      showPopup("Please enter your email.", "error");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/update/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to validate email");

      setPasswordToken(data.token);
      setStep("password");
      showPopup("Email validated. Enter new password.", "success");
    } catch (err: any) {
      showPopup(err.message || "Failed to validate email", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showPopup("Password must be at least 6 characters.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showPopup("Passwords do not match.", "error");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/update/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: passwordToken, password: newPassword, password_confirmation: confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");

      showPopup("Password changed successfully!", "success");
      router.replace("/(auth)/login");
    } catch (err: any) {
      showPopup(err.message || "Failed to reset password", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoSection}>
        <Image
          source={require("../../assets/home.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Forgot Password</Text>
      </View>

      {/* Email Step */}
      {step === "email" && (
        <>
          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="Enter your email"
            placeholderTextColor="#6b7280"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          <Pressable onPress={handleEmailSubmit} style={styles.button}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit Email</Text>}
          </Pressable>
        </>
      )}

      {/* Password Step */}
      {step === "password" && (
        <>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              placeholder="Enter new password"
              placeholderTextColor="#6b7280"
              secureTextEntry={!showPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              style={styles.passwordInput}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={22}
                color="#9ca3af"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              placeholder="Confirm new password"
              placeholderTextColor="#6b7280"
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.passwordInput}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={22}
                color="#9ca3af"
              />
            </TouchableOpacity>
          </View>

          <Pressable onPress={handleResetPassword} style={styles.button}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
          </Pressable>
        </>
      )}

      <Pressable onPress={() => router.push("/(auth)/login")} style={{ marginTop: 20 }}>
        <Text style={{ color: "#22c55e", textAlign: "center" }}>Back to Login</Text>
      </Pressable>

      {/* Popup */}
      {popup.visible && <PopupMessage visible={popup.visible} type={popup.type} message={popup.message} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f", padding: 24, justifyContent: "center" },
  logoSection: { alignItems: "center", marginBottom: 30 },
  logo: { width: 130, height: 130, opacity: 0.9 },
  title: { fontSize: 28, fontWeight: "700", color: "#22c55e", textAlign: "center", marginBottom: 20 },
  label: { color: "#fff", marginBottom: 6, marginLeft: 5, fontWeight: "600" },
  input: { backgroundColor: "#1b1b1b", padding: 16, borderRadius: 16, color: "#fff", marginBottom: 18, borderWidth: 1, borderColor: "#333" },
  passwordRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#1b1b1b", borderRadius: 16, paddingHorizontal: 12, marginBottom: 18, borderWidth: 1, borderColor: "#333" },
  passwordInput: { flex: 1, paddingVertical: 16, color: "#fff" },
  button: { backgroundColor: "#22c55e", paddingVertical: 15, borderRadius: 20, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
