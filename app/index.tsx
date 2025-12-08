import {
  View,
  Text,
  Pressable,
  Image,
  Animated,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import React from "react";

export default function HomeScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading && user) {
      router.replace("/(tabs)/dashboard");
    }
  }, [loading, user]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -10,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();
  }, []);

  if (loading || user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Illustration */}
      <Animated.View
        style={[
          styles.animatedWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: bounceAnim }],
          },
        ]}
      >
        <Image
          source={require("../assets/home.png")}
          style={styles.illustration}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Title */}
      <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
        Smart Bus Tracker
      </Animated.Text>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Monitor real-time bus locations, view routes, and stay updated for a
        faster, smarter commute.
      </Text>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <Pressable
          onPress={() => router.push("/(auth)/login")}
          style={styles.loginBtn}
        >
          <Text style={styles.btnText}>Login</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(auth)/register")}
          style={styles.registerBtn}
        >
          <Text style={styles.btnText}>Register</Text>
        </Pressable>
      </View>

      {/* Footer */}
      <Text style={styles.footer}>© 2025 Smart Bus Tracker</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f0f",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f0f0f",
  },
  loadingText: {
    color: "white",
    fontSize: 18,
  },

  animatedWrapper: {
    alignItems: "center",
    marginBottom: 40,
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },

  illustration: {
    width: 260,
    height: 260,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#22c55e",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    color: "#aaa",
    textAlign: "center",
    fontSize: 15,
    marginBottom: 40,
    paddingHorizontal: 20,
  },

  buttonRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
    gap: 12,
    marginBottom: 20,
  },

  loginBtn: {
    flex: 1,
    backgroundColor: "#22c55e",
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#22c55e",
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  registerBtn: {
    flex: 1,
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
    shadowColor: "#22c55e",
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  btnText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
  },

  footer: {
    color: "#666",
    textAlign: "center",
    marginTop: 40,
    fontSize: 11,
  },
});
