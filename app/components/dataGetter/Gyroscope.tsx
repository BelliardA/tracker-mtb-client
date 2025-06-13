import { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gyroscope, GyroscopeMeasurement } from 'expo-sensors';

/**
 * Gyroscope component that tracks and stores all gyroscope data when active.
 */

interface GyroProps {
  isRunning: boolean;
  setTrack: React.Dispatch<React.SetStateAction<GyroscopeMeasurement[]>>;
}

export default function Gyro({ isRunning, setTrack }: GyroProps) {

  const [subscription, setSubscription] = useState<ReturnType<typeof Gyroscope.addListener> | null>(null);

  // Met à jour toutes les 50ms
  Gyroscope.setUpdateInterval(50);

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
    const sub = Gyroscope.addListener((gyroscopeData) => {
      setTrack(prev => [...prev, gyroscopeData]); // ➕ Stockage de l'historique
    });
    setSubscription(sub);
  };

  const _unsubscribe = () => {
    subscription?.remove();
    setSubscription(null);
  };

  return null
}