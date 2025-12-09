import { View, Text, TextInput, Pressable, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill out all fields.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await login(email, password);
      router.replace("/(tabs)/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#22c55e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sign In</Text>
      </View>

      <View style={styles.mainContent}>
        <View style={styles.logoSection}>
          <Image
            source={require("../../assets/home.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Log in to your account</Text>
        </View>

        <View style={styles.card}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email */}
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

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="#6b7280"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
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

          <Pressable onPress={() => router.push("/(auth)/ForgotPassword")} style={styles.forgotRow}>
            <Text style={styles.forgotText}>Forgot Password</Text>
          </Pressable>

          {/* Login Button */}
          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginText}>Login</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.push("/(auth)/register")} style={styles.registerRow}>
            <Text style={styles.registerText}>Create an account</Text>
          </Pressable>
        </View>

        <Text style={styles.footer}>© 2025 Bus Tracking App</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    paddingHorizontal: 24,
    paddingTop: 40,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    padding: 8,
    borderRadius: 50,
    backgroundColor: "#111",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginLeft: 10,
  },

  mainContent: {
    flex: 1,
    justifyContent: "center",
  },

  logoSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 130,
    height: 130,
    opacity: 0.9,
  },
  title: {
    color: "#22c55e",
    fontSize: 30,
    fontWeight: "800",
    marginTop: 10,
  },
  subtitle: {
    color: "#888",
    marginTop: 4,
    fontSize: 15,
  },

  card: {
    backgroundColor: "rgba(20,20,20,0.7)",
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1f1f1f",
  },

  label: {
    color: "#ccc",
    marginBottom: 6,
    marginLeft: 2,
  },

  input: {
    backgroundColor: "#1b1b1b",
    padding: 16,
    borderRadius: 16,
    color: "white",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#333",
  },

  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1b1b1b",
    borderRadius: 16,
    paddingHorizontal: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 10,
    color: "white",
  },

  loginBtn: {
    backgroundColor: "#22c55e",
    paddingVertical: 15,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 5,
  },
  loginBtnDisabled: {
    backgroundColor: "#22c55e99",
  },
  loginText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },

  registerRow: {
    marginTop: 18,
  },
  registerText: {
    color: "#22c55e",
    textAlign: "center",
    textDecorationLine: "underline",
    fontSize: 15,
  },
  forgotRow: {
    marginTop: -10,
    marginBottom: 18
  },
  forgotText: {
    color: "#22c55e",
    textAlign: "right",
    textDecorationLine: "underline",
    fontSize: 15,
  },

  footer: {
    color: "#666",
    textAlign: "center",
    marginTop: 40,
    fontSize: 12,
  },

  errorBox: {
    backgroundColor: "rgba(255,0,0,0.15)",
    padding: 10,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255,0,0,0.3)",
  },
  errorText: {
    color: "#ff6b6b",
    textAlign: "center",
  },
});
