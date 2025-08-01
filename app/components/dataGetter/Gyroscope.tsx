import { Gyroscope, GyroscopeMeasurement } from 'expo-sensors';
import { useEffect, useRef } from 'react';

/**
 * Gyroscope component that tracks and stores all gyroscope data when active.
 */

interface GyroProps {
  isRunning: boolean;
  setTrack: React.Dispatch<React.SetStateAction<GyroscopeMeasurement[]>>;
}

export default function Gyro({ isRunning, setTrack }: GyroProps) {
  const subscription = useRef<ReturnType<typeof Gyroscope.addListener> | null>(
    null
  );

  // Met à jour toutes les 50ms
  Gyroscope.setUpdateInterval(50);

  useEffect(() => {
    if (!isRunning) {
      subscription.current?.remove();
      subscription.current = null;
      return;
    }

    const sub = Gyroscope.addListener((gyroscopeData) => {
      setTrack((prev) => [...prev, gyroscopeData]); 
    });
    subscription.current = sub;

    return () => {
      sub.remove();
      subscription.current = null;
    };
  }, [isRunning, setTrack]);

  return null;
}
