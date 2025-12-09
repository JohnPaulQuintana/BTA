import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import PopupMessage from "../../components/PopupMessage";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.apiUrl as string;

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const router = useRouter();

  // Profile states
  const [editName, setEditName] = useState(user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");

  // Password change states
  const [verifyEmail, setVerifyEmail] = useState("");
  const [passwordToken, setPasswordToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  // Popup state
  const [popup, setPopup] = useState<{
    visible: boolean;
    type: "success" | "error";
    message: string;
  }>({ visible: false, type: "success", message: "" });

  // Logout
  const handleLogout = async () => {
    const ok = await logout();
    if (ok) router.replace("/(auth)/login");
  };

  // Profile update
  const handleSaveProfile = async () => {
    if (!editName || !editEmail) {
      showPopup("All fields are required", "error");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/update/info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editName, email: editEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      showPopup("Profile updated successfully", "success");
    } catch {
      showPopup("Failed to update profile", "error");
    }
  };

  // Request password change (step 1)
  const handleRequestPasswordChange = async () => {
    if (!verifyEmail) {
      showPopup("Email should be the same on registration", "error");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/update/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: verifyEmail }),
      });

      const data = await res.json();
      console.log(data);

      if (!res.ok) {
        // Throw the server-provided message
        throw new Error(data.message || "Request failed");
      }

      // Save token from response and show modal for new password
      setPasswordToken(data.token);
      showPopup(data.message || "Enter new password", "success");
      setModalVisible(true);
    } catch (error: any) {
      // Display the exact server error
      showPopup(error.message || "Failed to request password change", "error");
    }
  };

  // Confirm new password (step 2)
  const handleConfirmNewPassword = async () => {
  if (!newPassword || newPassword.length < 6) {
    showPopup("Password must be at least 6 characters", "error");
    return;
  }
  if (newPassword !== confirmPassword) {
    showPopup("Passwords do not match", "error");
    return;
  }

  // Prepare the payload
  const payload = {
    token: passwordToken,
    password: newPassword,
    password_confirmation: confirmPassword, // include if using 'confirmed' validation
  };

  console.log("Sending reset-password request:", payload);

  try {
    const res = await fetch(`${API_URL}/api/update/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("Server response:", data);

    if (!res.ok) throw new Error(data.error || "Password update failed");

    showPopup("Password changed successfully", "success");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordToken(null);
    setModalVisible(false);
    handleLogout()
  } catch (error: any) {
    console.error("Reset password error:", error);
    showPopup(error.message || "Failed to change password", "error");
  }
};


  // Utility: show popup
  const showPopup = (message: string, type: "success" | "error") => {
    setPopup({ visible: true, type, message });
    setTimeout(() => setPopup({ visible: false, type, message: "" }), 2500);
  };

  const formatDate = (dateString: string | number | Date) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleName = (roleId: any) => {
    switch (roleId) {
      case 1:
        return "Admin";
      case 2:
        return "Driver";
      case 3:
        return "Passenger";
      default:
        return `Role ${roleId}`;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="person-circle" size={80} color="#22c55e" />
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || "User"}</Text>
          <View
            style={[
              styles.roleBadge,
              user?.role_id === 1
                ? styles.adminBadge
                : user?.role_id === 2
                  ? styles.driverBadge
                  : styles.passengerBadge,
            ]}
          >
            <Text style={styles.roleText}>{getRoleName(user?.role_id)}</Text>
          </View>
        </View>

        {/* Profile Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profile Information</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="person-outline" size={20} color="#22c55e" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <TextInput
                placeholder="Update Name"
                placeholderTextColor="#9ca3af"
                value={editName}
                onChangeText={setEditName}
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 12,
                  marginBottom: 12,
                }}
              />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="mail-outline" size={20} color="#22c55e" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <TextInput
                placeholder="Update Email"
                placeholderTextColor="#9ca3af"
                value={editEmail}
                onChangeText={setEditEmail}
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "#fff",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 12,
                  marginBottom: 12,
                }}
              />
              {user?.email_verified_at ? (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#22c55e" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              ) : (
                <View style={styles.unverifiedBadge}>
                  <Ionicons name="alert-circle" size={12} color="#ef4444" />
                  <Text style={styles.unverifiedText}>Not verified</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="calendar-outline" size={20} color="#22c55e" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Account Created</Text>
              <Text style={styles.infoValue}>
                {formatDate(user?.created_at ?? "")}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="time-outline" size={20} color="#22c55e" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>
                {formatDate(user?.updated_at ?? "")}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            onPress={handleSaveProfile}
            style={{
              backgroundColor: "#22c55e",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              Update Info
            </Text>
          </TouchableOpacity>
        </View>

        {/* Account Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Status</Text>
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <View style={[styles.statusIcon, styles.verifiedIcon]}>
                <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
              </View>
              <Text style={styles.statusTitle}>Active</Text>
              <Text style={styles.statusDescription}>Account is active</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.statusItem}>
              <View
                style={[
                  styles.statusIcon,
                  user?.email_verified_at
                    ? styles.verifiedIcon
                    : styles.unverifiedIcon,
                ]}
              >
                <Ionicons
                  name={
                    user?.email_verified_at ? "checkmark-circle" : "mail-unread"
                  }
                  size={24}
                  color={user?.email_verified_at ? "#22c55e" : "#ef4444"}
                />
              </View>
              <Text style={styles.statusTitle}>
                {user?.email_verified_at ? "Verified" : "Pending"}
              </Text>
              <Text style={styles.statusDescription}>
                {user?.email_verified_at
                  ? "Email verified"
                  : "Email not verified"}
              </Text>
            </View>
          </View>
        </View>

        {/* Change Password Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Change Password</Text>
          <TextInput
            placeholder="Enter your Email"
            placeholderTextColor="#9ca3af"
            value={verifyEmail}
            onChangeText={setVerifyEmail}
            style={{
              backgroundColor: "rgba(255,255,255,0.05)",
              color: "#fff",
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
              marginBottom: 12,
            }}
          />
          <TouchableOpacity
            onPress={handleRequestPasswordChange}
            style={{
              backgroundColor: "#22c55e",
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>
              Request Change Password
            </Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color="#ffffff" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Popup Message */}
        <PopupMessage
          visible={popup.visible}
          type={popup.type}
          message={popup.message}
          onClose={() => setPopup({ ...popup, visible: false })}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Bus Tracking System</Text>
          <Text style={styles.footerSubtext}>v1.0.0</Text>
        </View>
      </ScrollView>

      {/* Password Overlay */}
      {modalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.cardTitle}>Change Password</Text>
            <Text style={{
              color: "white",
              marginBottom: 2
            }}>New Password:</Text>
            <TextInput
              placeholder="New Password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              style={styles.input}
            />

            <Text style={{
              color: "white",
              marginBottom: 2
            }}>Confirm Password:</Text>
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
            />

            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                onPress={handleConfirmNewPassword}
                style={[styles.button, { flex: 1 }]}
              >
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.button, { backgroundColor: "#ef4444", flex: 1 }]}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  contentContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  welcomeText: {
    color: "#9ca3af",
    fontSize: 16,
    marginBottom: 4,
  },
  userName: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  adminBadge: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  driverBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  passengerBadge: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderWidth: 1,
    borderColor: "#22c55e",
  },
  roleText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "rgba(17, 24, 39, 0.8)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 18,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 4,
  },
  infoValue: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  infoSubtext: {
    color: "#6b7280",
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  verifiedText: {
    color: "#22c55e",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  unverifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  unverifiedText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  statusGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  verifiedIcon: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  unverifiedIcon: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  statusTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  statusDescription: {
    color: "#9ca3af",
    fontSize: 12,
    textAlign: "center",
  },
  verticalDivider: {
    width: 1,
    height: 60,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  logoutBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 30,
    gap: 12,
  },
  logoutText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  footerText: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 4,
  },
  footerSubtext: {
    color: "#6b7280",
    fontSize: 12,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000, // make sure it's on top
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#111827",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#22c55e",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
