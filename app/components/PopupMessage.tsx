import React from "react";
import { View, Text, Modal, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PopupMessageProps {
  visible: boolean;
  type?: "success" | "error";
  message: string;
  onClose?: () => void;
}

export default function PopupMessage({
  visible,
  type = "success",
  message,
  onClose,
}: PopupMessageProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.box,
            type === "success" ? styles.successBg : styles.errorBg,
          ]}
        >
          <Ionicons
            name={type === "success" ? "checkmark-circle" : "alert-circle"}
            size={48}
            color="white"
          />

          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)", // bg-black/50
  },

  box: {
    width: 288, // w-72
    borderRadius: 16, // rounded-2xl
    padding: 20, // p-5
    alignItems: "center",
  },

  successBg: {
    backgroundColor: "#16a34a", // green-600
  },

  errorBg: {
    backgroundColor: "#dc2626", // red-600
  },

  message: {
    color: "white",
    fontSize: 18, // text-lg
    fontWeight: "600", // font-semibold
    textAlign: "center",
    marginTop: 12, // mt-3
  },
});
