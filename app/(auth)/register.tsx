// app/(auth)/register.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import PopupMessage from "../../components/PopupMessage";

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState<"success" | "error">("success");
  const [popupMessage, setPopupMessage] = useState("");

  const showPopup = (type: "success" | "error", message: string) => {
    setPopupType(type);
    setPopupMessage(message);
    setPopupVisible(true);
    setTimeout(() => setPopupVisible(false), 2000);
  };

  useEffect(() => {
    if (shouldRedirect) {
      router.replace("/(tabs)/dashboard");
    }
  }, [shouldRedirect, router]);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      showPopup("error", "Please fill out all fields.");
      return;
    }

    try {
      setLoading(true);
      const response = await register(name, email, password);
      console.log(response)
      showPopup("success", "Account created successfully!");
      setTimeout(() => {
        setShouldRedirect(true);
      }, 1800);
    } catch (err: any) {
      console.log(err)
      showPopup("error", err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color="#22c55e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Account</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Image
          source={require("../../assets/home.png")}
          style={styles.headerImage}
          resizeMode="contain"
        />

        <Text style={styles.appTitle}>Smart Bus Tracker</Text>
        <Text style={styles.subtitle}>Create an account to get started</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            placeholder="Enter your name"
            placeholderTextColor="#6b7280"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

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

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="#6b7280"
              value={password}
              secureTextEntry={!showPassword}
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

          <Pressable
            onPress={handleRegister}
            disabled={loading}
            style={[
              styles.registerButton,
              loading ? styles.registerButtonDisabled : null,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.registerButtonText}>Register</Text>
            )}
          </Pressable>

          <Pressable onPress={() => router.push("/(auth)/login")} style={styles.loginLink}>
            <Text style={styles.loginText}>
              Already have an account? Login
            </Text>
          </Pressable>
        </View>

        <Text style={styles.footerText}>© 2025 Bus Tracking App</Text>
      </View>

      {/* Popup */}
      <PopupMessage
        visible={popupVisible}
        type={popupType}
        message={popupMessage}
        onClose={() => setPopupVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerImage: {
    width: 160,
    height: 160,
    marginBottom: 12,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#22c55e",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 24,
  },
  form: {
    width: "100%",
  },
  label: {
    color: "#d1d5db",
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#1f2937",
    color: "#ffffff",
    padding: 16,
    borderRadius: 24,
    marginBottom: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f2937",
    borderRadius: 24,
    paddingHorizontal: 12,
    marginBottom: 24,
  },
  passwordInput: {
    flex: 1,
    color: "#ffffff",
    paddingVertical: 16,
    paddingHorizontal: 0,
  },
  registerButton: {
    backgroundColor: "#16a34a",
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  registerButtonDisabled: {
    backgroundColor: "#16a34a80",
  },
  registerButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginLink: {
    marginTop: 12,
  },
  loginText: {
    color: "#22c55e",
    textAlign: "center",
    textDecorationLine: "underline",
    fontWeight: "500",
  },
  footerText: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 40,
    textAlign: "center",
  },
});
