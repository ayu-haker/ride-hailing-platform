const EARTH_RADIUS_KM = 6371;
const EARTH_RADIUS_M = 6371000;

export function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  return haversineDistance(lat1, lon1, lat2, lon2) * 1000;
}

export function getBoundingBox(
  lat: number,
  lon: number,
  radiusKm: number,
): { north: number; south: number; east: number; west: number } {
  const latDelta = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI);
  const lonDelta =
    ((radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI)) /
    Math.cos(deg2rad(lat));

  return {
    north: lat + latDelta,
    south: lat - latDelta,
    east: lon + lonDelta,
    west: lon - lonDelta,
  };
}

export function isWithinRadius(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusKm: number,
): boolean {
  return haversineDistance(lat1, lon1, lat2, lon2) <= radiusKm;
}

export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLon = deg2rad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(deg2rad(lat2));
  const x =
    Math.cos(deg2rad(lat1)) * Math.sin(deg2rad(lat2)) -
    Math.sin(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.cos(dLon);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

export function calculateETA(
  distanceMeters: number,
  averageSpeedKmh: number = 25,
): number {
  if (averageSpeedKmh <= 0) return 0;
  const speedMs = averageSpeedKmh / 3.6;
  return Math.ceil(distanceMeters / speedMs);
}

export function midpoint(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): { latitude: number; longitude: number } {
  const dLon = deg2rad(lon2 - lon1);
  const lat1Rad = deg2rad(lat1);
  const lat2Rad = deg2rad(lat2);
  const lon1Rad = deg2rad(lon1);

  const Bx = Math.cos(lat2Rad) * Math.cos(dLon);
  const By = Math.cos(lat2Rad) * Math.sin(dLon);
  const lat3 = Math.atan2(
    Math.sin(lat1Rad) + Math.sin(lat2Rad),
    Math.sqrt((Math.cos(lat1Rad) + Bx) * (Math.cos(lat1Rad) + Bx) + By * By),
  );
  const lon3 = lon1Rad + Math.atan2(By, Math.cos(lat1Rad) + Bx);

  return {
    latitude: (lat3 * 180) / Math.PI,
    longitude: (lon3 * 180) / Math.PI,
  };
}

export function sortByDistance<T extends { latitude: number; longitude: number }>(
  items: T[],
  refLat: number,
  refLon: number,
): (T & { distanceKm: number })[] {
  return items
    .map((item) => ({
      ...item,
      distanceKm: haversineDistance(refLat, refLon, item.latitude, item.longitude),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
