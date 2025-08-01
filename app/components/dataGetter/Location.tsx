import * as Location from "expo-location";
import { useEffect, useRef } from "react";

interface LocalisationProps {
  isRunning: boolean;
  onLocationUpdate: (location: Location.LocationObject) => void;
  intervalMs?: number;
}

export default function Localisation({
  isRunning,
  onLocationUpdate,
  intervalMs = 150,
}: LocalisationProps) {
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let isMounted = true;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("⛔ Permission denied for location");
        return;
      }

      if (isRunning && isMounted) {
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            timeInterval: intervalMs,
            distanceInterval: 0, // 0 pour que ça déclenche même sans déplacement
          },
          (location) => {
            onLocationUpdate(location);
          }
        );
      }
    };

    startTracking();

    return () => {
      isMounted = false;
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, [isRunning, intervalMs]);

  return null;
}