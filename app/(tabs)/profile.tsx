import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import React from "react";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
const router = useRouter();

  const handleLogout = async () => {
    const ok = await logout();
    if (ok) router.replace("/(auth)/login");
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <Text style={styles.subtitle}>
        Email: {user?.email || "unknown"}
      </Text>

      <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",   // bg-gray-950
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "#9ca3af",   // gray-400
    fontSize: 16,
    marginBottom: 20,
  },
  logoutBtn: {
    backgroundColor: "#dc2626",  // red-600
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 50,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
});
