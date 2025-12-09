// components/AddressDisplay.tsx
import React from "react";
import { Text, StyleSheet } from "react-native";
import { useAddress } from "../hooks/useAddress";

interface AddressDisplayProps {
  lat: number | null;
  long: number | null;
}

export const AddressDisplay: React.FC<AddressDisplayProps> = ({
  lat,
  long,
}) => {
  const address = useAddress(lat, long);

  if (address === "N/A") {
    return (
      <Text style={styles.locationCoords}>
        {lat?.toFixed(6) || "0.000000"}, {long?.toFixed(6) || "0.000000"}
      </Text>
    );
  }

  return <Text style={styles.locationCoords}>{address}</Text>;
};

const styles = StyleSheet.create({
  locationCoords: {
    color: "#ffffff",
    fontSize: 14,
    fontFamily: "monospace",
    letterSpacing: 0.5,
  },
});
