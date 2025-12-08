// components/AddressDisplay.tsx
import React from "react";
import { Text, StyleSheet } from "react-native";
import { useAddress } from "../hooks/useAddress";

interface AddressDisplayProps {
  lat: number | null;
  long: number | null;
}

export const NearestStopAddress: React.FC<AddressDisplayProps> = ({
  lat,
  long,
}) => {
  const address = useAddress(lat, long);

  if (address === "N/A") {
    return (
      <Text style={styles.metricLabel}>
        {lat?.toFixed(6) || "0.000000"}, {long?.toFixed(6) || "0.000000"}
      </Text>
    );
  }

  return <Text style={styles.metricLabel}>{address}</Text>;
};

const styles = StyleSheet.create({
  metricLabel: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "500",
  },
});
