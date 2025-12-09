import * as Location from "expo-location";

export const fetchAddress = async (lat: number, long: number) => {
  try {
    // 1. Ask for permission first
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return "Location permission denied";
    }

    // 2. Ensure Google Play services are enabled
    await Location.enableNetworkProviderAsync(); // Android only

    const [location] = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: long,
    });

    if (location) {
      return `${location.name || ""} ${location.street || ""}, ${location.city || ""}, ${location.region || ""}, ${location.country || ""}`;
    }

    return "No address found";
  } catch (error) {
    console.log("Error reverse geocoding:", error);
    return "Unable to get address";
  }
};
