export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Calculate the distance in meters between two latitude/longitude points
 * using the Haversine formula.
 */
export const getDistance = (a: Coordinates, b: Coordinates): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371e3; // Earth's radius in meters
  const phi1 = toRad(a.latitude);
  const phi2 = toRad(b.latitude);
  const deltaPhi = toRad(b.latitude - a.latitude);
  const deltaLambda = toRad(b.longitude - a.longitude);

  const h =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
};
