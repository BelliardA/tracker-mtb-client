import { useEffect, useRef } from "react";
import * as Location from "expo-location";

export type LocationData = {
  timestamp: number;
  coords: {
    latitude: number;
    longitude: number;
    altitude: number;
    speed?: number;
    heading?: number;
    altitudeAccuracy?: number;
  };
};

interface LocalisationProps {
  isRunning: boolean;
  setTrack: React.Dispatch<React.SetStateAction<LocationData[]>>;
}

export default function Localisation({ isRunning, setTrack }: LocalisationProps) {
  const intervalId = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const requestPermissionAndStart = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Permission to access location was denied");
        return;
      }

      if (isRunning && isMounted) {
        intervalId.current = setInterval(async () => {
          try {
            const loc = await Location.getCurrentPositionAsync({});
            // stocke la donnée brute GPS complète
            setTrack((prev) => [...prev, loc as LocationData]);
          } catch (error) {
            console.warn("Error getting location:", error);
          }
        }, 150);
      }
    };

    requestPermissionAndStart();

    return () => {
      isMounted = false;
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, [isRunning, setTrack]);

  return null;
}