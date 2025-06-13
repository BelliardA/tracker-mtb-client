import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { Barometer, BarometerMeasurement } from 'expo-sensors';

/**
 * Barometre component that tracks and displays barometric pressure and relative altitude.
 * The relative altitude is only available on iOS devices.
 */

interface BarometerProps {
  isRunning: boolean;
  setTrack: React.Dispatch<React.SetStateAction<BarometerMeasurement[]>>;
}


export default function Barometre({ isRunning, setTrack }: BarometerProps) {

  const [subscription, setSubscription] = useState<ReturnType<typeof Barometer.addListener> | null>(null);

  useEffect(() => {
    if (isRunning) {
      subscribe();
    } else {
      unsubscribe();
    }

    return () => {
      unsubscribe();
    };
  }, [isRunning]);

  const subscribe = () => {
    const sub = Barometer.addListener((barometerData) => {
      setTrack(prev => [...prev, barometerData]); // Store the history
    });
    setSubscription(sub);
  };

  const unsubscribe = () => {
    subscription?.remove();
    setSubscription(null);
  };

  return null

}