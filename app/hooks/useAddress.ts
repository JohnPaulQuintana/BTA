// hooks/useAddress.ts
import { useState, useEffect, useRef } from "react";
import { fetchAddress } from "../services/geocodingService";

export function useAddress(lat: number | null, long: number | null) {
  const [address, setAddress] = useState<string>("N/A");

  const prevLat = useRef<number | null>(null);
  const prevLong = useRef<number | null>(null);

  useEffect(() => {
    if (lat === prevLat.current && long === prevLong.current) return; // nothing changed

    prevLat.current = lat;
    prevLong.current = long;

    if (lat === null || long === null) {
      setAddress("N/A");
      return;
    }

    let isCancelled = false;

    const getAddress = async () => {
      const result = await fetchAddress(lat, long);
      if (!isCancelled) setAddress(result || "Unknown location");
    };

    getAddress();

    return () => {
      isCancelled = true;
    };
  }, [lat, long]);

  return address;
}
