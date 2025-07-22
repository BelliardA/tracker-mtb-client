import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { LocationObject } from 'expo-location';

type Mode = 'track' | 'onlyOnce';

interface LocationTrackerProps {
  mode: Mode;
  isRunning: boolean;
  onLocationUpdate: (location: LocationObject) => void;
  intervalMs?: number; // Pour pouvoir custom l'interval si tu veux
}

const LocationTracker: React.FC<LocationTrackerProps> = ({
  mode,
  isRunning,
  onLocationUpdate,
  intervalMs = 150,
}) => {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    let interval: number | null = null;

    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      onLocationUpdate(location);
    };

    if (mode === 'onlyOnce') {
      getLocation();
    } else if (mode === 'track' && isRunning) {
      interval = setInterval(() => {
        getLocation();
      }, intervalMs);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
    };
  }
  }, [mode, isRunning, intervalMs, onLocationUpdate]);

  return null;
};

export default LocationTracker;