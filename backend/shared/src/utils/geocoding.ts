import type { IGeocodingResult, ICoordinates } from '../interfaces';

const OSM_NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<IGeocodingResult | null> {
  try {
    const url = `${OSM_NOMINATIM_URL}/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=en`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'RideHailing/1.0' },
    });
    if (!response.ok) return null;

    const data = await response.json();
    if (!data || data.error) return null;

    return {
      displayName: data.display_name || '',
      address: data.address?.road || '',
      street: data.address?.road,
      city:
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        '',
      state: data.address?.state || '',
      country: data.address?.country || '',
      pincode: data.address?.postcode || '',
      latitude,
      longitude,
      placeId: data.osm_id?.toString(),
    };
  } catch {
    return null;
  }
}

export async function searchLocation(
  query: string,
  limit: number = 5,
): Promise<IGeocodingResult[]> {
  try {
    const url = `${OSM_NOMINATIM_URL}/search?format=jsonv2&q=${encodeURIComponent(query)}&limit=${limit}&accept-language=en`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'RideHailing/1.0' },
    });
    if (!response.ok) return [];

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => ({
      displayName: item.display_name || '',
      address: item.name || '',
      city:
        item.address?.city ||
        item.address?.town ||
        item.address?.village ||
        '',
      state: item.address?.state || '',
      country: item.address?.country || '',
      pincode: item.address?.postcode || '',
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      placeId: item.osm_id?.toString(),
    }));
  } catch {
    return [];
  }
}

export async function getRoutePolyline(
  origin: ICoordinates,
  destination: ICoordinates,
): Promise<{ polyline: string; distance: number; duration: number } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.routes || data.routes.length === 0) return null;

    const route = data.routes[0];
    const coordinates = route.geometry.coordinates
      .map((coord: number[]) => `${coord[1]},${coord[0]}`)
      .join(';');

    return {
      polyline: coordinates,
      distance: route.distance,
      duration: route.duration,
    };
  } catch {
    return null;
  }
}

export function calculateFareEstimate(
  distanceMeters: number,
  durationSeconds: number,
  baseFare: number,
  perKmRate: number,
  perMinuteRate: number,
  surgeMultiplier: number = 1,
  minimumFare: number = 25,
): {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeMultiplier: number;
  totalFare: number;
} {
  const distanceKm = distanceMeters / 1000;
  const durationMinutes = durationSeconds / 60;

  const distanceFare = distanceKm * perKmRate;
  const timeFare = durationMinutes * perMinuteRate;
  const subtotal = baseFare + distanceFare + timeFare;
  const totalFare = Math.max(subtotal * surgeMultiplier, minimumFare);

  return {
    baseFare,
    distanceFare,
    timeFare: Math.round(timeFare * 100) / 100,
    surgeMultiplier,
    totalFare: Math.round(totalFare * 100) / 100,
  };
}
