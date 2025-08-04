import { Accelerometer, AccelerometerMeasurement } from 'expo-sensors';
import { useEffect, useRef } from 'react';

/**
 * Accelerometre component that tracks and displays accelerometer data.
 * The data is updated at a specified interval and can be toggled on or off.
 */

interface AccelerometerProps {
  isRunning: boolean;
  setTrack: React.Dispatch<React.SetStateAction<AccelerometerMeasurement[]>>;
}

export default function Accelerometre({
  isRunning,
  setTrack,
}: AccelerometerProps) {
  const subscription = useRef<ReturnType<
    typeof Accelerometer.addListener
  > | null>(null);

  Accelerometer.setUpdateInterval(50);

  useEffect(() => {
    if (!isRunning) {
      subscription.current?.remove();
      subscription.current = null;
      return;
    }

    const sub = Accelerometer.addListener((accelerometerData) => {
      setTrack((prev) => [...prev, accelerometerData]);
    });
    subscription.current = sub;

    return () => {
      sub.remove();
      subscription.current = null;
    };
  }, [isRunning, setTrack]);

  return null; // No UI component to render, just data tracking
}
