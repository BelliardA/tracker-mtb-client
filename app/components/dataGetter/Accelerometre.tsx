import { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Accelerometer, AccelerometerMeasurement } from 'expo-sensors';

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
  const [subscription, setSubscription] = useState<ReturnType<
    typeof Accelerometer.addListener
  > | null>(null);

  Accelerometer.setUpdateInterval(50);

  useEffect(() => {
    if (isRunning) {
      _subscribe();
    } else {
      _unsubscribe();
    }

    return () => {
      _unsubscribe();
    };
  }, [isRunning]);

  const _subscribe = () => {
    const sub = Accelerometer.addListener((accelerometerData) => {
      setTrack((prev) => [...prev, accelerometerData]); // Store the history
    });
    setSubscription(sub);
  };

  const _unsubscribe = () => {
    subscription?.remove();
    setSubscription(null);
  };

  return null; // No UI component to render, just data tracking
}
