import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";
import { useAddress } from "../hooks/useAddress";

export function StopMarker({
  stop,
}: {
  stop: {
    id: number;
    name: string;
    lat?: number | null;
    long?: number | null;
  };
}) {
  // Always call the hook, pass null if missing
  const address = useAddress(stop.lat ?? null, stop.long ?? null);

  // Optionally skip rendering if coords are invalid
  if (stop.lat == null || stop.long == null) return null;

  return (
    <Marker
      coordinate={{ latitude: stop.lat, longitude: stop.long }}
      title={address || stop.name || "Unknown Stop"}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.stopMarker}>
        <View style={styles.stopIcon}>
          <Ionicons name="location" size={18} color="white" />
        </View>
      </View>
    </Marker>
  );
}



const styles = StyleSheet.create({
  stopMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  stopIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
