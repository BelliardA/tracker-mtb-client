import { Barometer, BarometerMeasurement } from 'expo-sensors';
import React, { useEffect, useRef } from 'react';

/**
 * Barometre component that tracks and displays barometric pressure and relative altitude.
 * The relative altitude is only available on iOS devices.
 */

interface BarometerProps {
  isRunning: boolean;
  setTrack: React.Dispatch<React.SetStateAction<BarometerMeasurement[]>>;
}

export default function Barometre({ isRunning, setTrack }: BarometerProps) {
  const subscription = useRef<ReturnType<typeof Barometer.addListener> | null>(
    null
  );

  useEffect(() => {
    if (!isRunning) {
      subscription.current?.remove();
      subscription.current = null;
      return;
    }

    const sub = Barometer.addListener((barometerData) => {
      setTrack((prev) => [...prev, barometerData]);
    });
    subscription.current = sub;

    return () => {
      sub.remove();
      subscription.current = null;
    };
  }, [isRunning, setTrack]);

  return null;
}
