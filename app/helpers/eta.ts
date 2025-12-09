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
  return `${Math.round(minutes)} min`;
}

export function calculateETA(distanceKm: number, speedMs: number) {
  if (!speedMs || speedMs <= 0) return "Not moving";

  const speedKmh = speedMs * 3.6; // convert m/s → km/h
  const hours = distanceKm / speedKmh;
  const minutes = hours * 60;

  return formatETA(minutes);
}
