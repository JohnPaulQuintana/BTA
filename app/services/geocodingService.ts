import * as Location from "expo-location";
export const fetchAddress = async (lat:number,long:number) => {
  try {
    const [location] = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: long,
    });

    if (location) {
      const address = `${location.name || ""} ${location.street || ""}, ${location.city || ""}, ${location.region || ""}, ${location.country || ""}`;
      return address
    }
  } catch (error) {
    return "Unable to get address";
  }
};
