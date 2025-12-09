export function haversineDistance(lat1:number, lon1:number, lat2:number, lon2:number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // km
}

export function formatETA(minutes:number) {
  if (minutes <= 0) return "Arriving now";
  if (minutes < 1) return "< 1 min";
  if (minutes < 2) return "1 min";
  return `${Math.round(minutes)} min`;
}

// FIXED VERSION: Your API returns speed in km/h, not m/s
export function calculateETA(distanceKm: number, speedKmh: number) {
  console.log(`[ETA CALC] distance: ${distanceKm.toFixed(4)}km, speed: ${speedKmh}`);
  
  if (!speedKmh || speedKmh <= 0) return "Not moving";
  
  // REMOVED the incorrect conversion:
  // const speedKmh = speedMs * 3.6; // ← This was wrong!
  
  const hours = distanceKm / speedKmh;
  const minutes = hours * 60;
  
  console.log(`[ETA CALC] ${distanceKm.toFixed(3)}km ÷ ${speedKmh}km/h = ${hours.toFixed(4)}h = ${minutes.toFixed(1)}min`);
  
  return formatETA(minutes);
}

// Alternative: Version that automatically detects unit
export function calculateETASmart(distanceKm: number, speed: number) {
  console.log(`[SMART ETA] distance: ${distanceKm.toFixed(4)}km, speed: ${speed}`);
  
  if (!speed || speed <= 0) return "Not moving";
  
  let speedKmh;
  
  // Auto-detect unit based on typical ranges
  // Most GPS APIs return km/h for vehicle speeds
  if (speed < 30) {
    // Could be m/s (5 m/s = 18 km/h) or km/h (5 km/h for slow traffic)
    // Check distance to decide: if distance is small and speed is low, likely km/h
    if (distanceKm < 0.5 && speed < 10) {
      // Short distance + low speed = likely km/h (walking/bus in traffic)
      speedKmh = speed;
      console.log(`[SMART ETA] Assuming ${speed} km/h (slow traffic)`);
    } else {
      // Try as m/s first (common for GPS raw data)
      speedKmh = speed * 3.6;
      console.log(`[SMART ETA] Assuming ${speed} m/s = ${speedKmh} km/h`);
    }
  } else {
    // > 30 is almost certainly km/h (30 m/s = 108 km/h is too specific)
    speedKmh = speed;
    console.log(`[SMART ETA] Assuming ${speed} km/h`);
  }
  
  const hours = distanceKm / speedKmh;
  const minutes = hours * 60;
  
  console.log(`[SMART ETA] Result: ${minutes.toFixed(1)} minutes`);
  return formatETA(minutes);
}