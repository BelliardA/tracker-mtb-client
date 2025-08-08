import { useAuth } from '@/context/AuthContext';
import * as FileSystem from 'expo-file-system';
import { LocationObject } from 'expo-location';
import { Redirect, useRouter } from 'expo-router';
import {
  AccelerometerMeasurement,
  BarometerMeasurement,
  GyroscopeMeasurement,
} from 'expo-sensors';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Accelerometre from '../components/dataGetter/Accelerometre';
import Barometre from '../components/dataGetter/Barometre';
import Gyro from '../components/dataGetter/Gyroscope';
import Localisation from '../components/dataGetter/Location';
import { getDistance } from '../utils/distanceCalculate';

export default function DataSender() {
  const { authState, refreshAuthFromStorage } = useAuth();
  const router = useRouter();

  const handleGoLogin = useCallback(() => {
    router.replace('/pages/Login');
  }, [router]);

  const [authRetrying, setAuthRetrying] = useState(false);
  const handleRetryAuth = useCallback(async () => {
    setAuthRetrying(true);
    try {
      await refreshAuthFromStorage?.();
    } finally {
      setTimeout(() => setAuthRetrying(false), 400);
    }
  }, [refreshAuthFromStorage]);

  const [screen, setScreen] = useState<'start' | 'tracking' | 'end'>('start');

  useEffect(() => {
    if (
      !authState?.loading &&
      (!authState?.authenticated || !authState?.token)
    ) {
      refreshAuthFromStorage?.();
    }
  }, [
    authState?.loading,
    authState?.authenticated,
    authState?.token,
    refreshAuthFromStorage,
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [trackName, setTrackName] = useState<string>('');

  const [trackGyro, setTrackGyro] = useState<GyroscopeMeasurement[]>([]);
  const [trackBaro, setTrackBaro] = useState<BarometerMeasurement[]>([]);
  const [trackAccel, setTrackAccel] = useState<AccelerometerMeasurement[]>([]);
  const [trackLocation, setTrackLocation] = useState<LocationObject[]>([]);

  const STORAGE_PATH = FileSystem.documentDirectory + 'sessionBuffer.json';

  const toggleRunning = () => {
    if (!isRunning) {
      setStartTime(new Date().toISOString());
      setEndTime(null);
      setScreen('tracking');
    } else {
      setEndTime(new Date().toISOString());
      setScreen('end');
    }
    setIsRunning(!isRunning);
  };

  const sendData = async () => {
    console.log('🚀 Envoi en cours...');
    if (!startTime || !endTime) {
      console.log({ startTime, endTime });
      return;
    }

    const session = {
      name: trackName || 'Session sans nom',
      startTime,
      endTime,
      notes: 'Session envoyée depuis DataSender',
      sensors: {
        accelerometer: trackAccel,
        gyroscope: trackGyro,
        barometer: trackBaro,
        gps: trackLocation.map((loc) => ({
          timestamp: loc.timestamp,
          coords: {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            altitude: loc.coords.altitude,
            speed: loc.coords.speed,
            heading: loc.coords.heading,
            altitudeAccuracy: loc.coords.altitudeAccuracy,
          },
        })),
      },
    };

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_URL_SERVEUR_API_DEV}/session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authState?.token}`,
          },
          body: JSON.stringify(session),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        Alert.alert(
          'Erreur',
          result.message || 'Une erreur est survenue lors de l’envoi.'
        );
        return;
      }
      console.log('✅ Session envoyée avec succès :', result);
      Alert.alert('Succès', 'Track envoyée !');
      router.replace('/pages/Map');
    } catch (error) {
      console.error("❌ Erreur d'envoi :", error);
      await FileSystem.writeAsStringAsync(
        STORAGE_PATH,
        JSON.stringify(session)
      );
      Alert.alert(
        'Sauvegarde locale',
        'Track enregistrée hors-ligne. Elle sera envoyée plus tard.'
      );
      router.replace('/pages/Map');
    }
  };

  useEffect(() => {
    const sendOfflineDataIfExists = async () => {
      if (!authState?.token) {
        return;
      }
      const fileInfo = await FileSystem.getInfoAsync(STORAGE_PATH);
      if (!fileInfo.exists) return;

      try {
        const content = await FileSystem.readAsStringAsync(STORAGE_PATH);
        const session = JSON.parse(content);

        const response = await fetch(
          `${process.env.EXPO_PUBLIC_URL_SERVEUR_API_DEV}/session`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authState?.token}`,
            },
            body: JSON.stringify(session),
          }
        );

        const result = await response.json();
        console.log('✅ Session offline envoyée :', result);
        await FileSystem.deleteAsync(STORAGE_PATH);
      } catch (error) {
        console.error("❌ Échec d'envoi de la session offline :", error);
      }
    };
    sendOfflineDataIfExists();
  }, [STORAGE_PATH, authState?.token]);

  const getCurrentSpeed = () => {
    const latest = trackLocation.at(-1);
    return latest?.coords.speed && latest.coords.speed > 0
      ? latest.coords.speed
      : 0;
  };

  const getAltitude = () => {
    const latest = trackLocation.at(-1);
    return latest?.coords.altitude || 0;
  };

  const getElapsedTime = () => {
    if (!startTime) return 0;
    const now = endTime ? new Date(endTime) : new Date();
    const start = new Date(startTime);
    const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
    return elapsed;
  };

  const getInclinaison = () => {
    const latest = trackAccel.at(-1);
    if (!latest) return 0;

    const angle = Math.atan2(latest.y, latest.z) * (180 / Math.PI);
    const normalized = Math.abs(angle + 180); // Normalize so flat is 0
    return Math.round(normalized);
  };

  const getTotalDistance = () => {
    if (trackLocation.length < 2) return 0;

    let distance = 0;
    for (let i = 1; i < trackLocation.length; i++) {
      const prev = trackLocation[i - 1];
      const curr = trackLocation[i];
      const d = getDistance(
        { latitude: prev.coords.latitude, longitude: prev.coords.longitude },
        { latitude: curr.coords.latitude, longitude: curr.coords.longitude }
      );

      if (d > 3 && d < 50) {
        // Ignore les sauts GPS < 3m (bruit) et > 50m (incohérents)
        distance += d;
      }
    }

    return distance / 1000; // retour en km
  };

  if (authState?.loading) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" />
        <Text style={{ color: '#fff', marginTop: 12 }}>
          Chargement de l’authentification…
        </Text>
      </View>
    );
  }

  if (!authState?.loading && (!authState?.authenticated || !authState?.token)) {
    return <Redirect href="/pages/Login" />;
  }

  return (
    <View style={styles.container}>
      <Localisation
        isRunning={isRunning}
        onLocationUpdate={(loc) => setTrackLocation((prev) => [...prev, loc])}
        intervalMs={1000}
      />
      <Accelerometre isRunning={isRunning} setTrack={setTrackAccel} />
      <Barometre isRunning={isRunning} setTrack={setTrackBaro} />
      <Gyro isRunning={isRunning} setTrack={setTrackGyro} />

      {screen === 'start' && (
        <View style={styles.dashboard}>
          <TouchableOpacity style={styles.startButton} onPress={toggleRunning}>
            <Text style={styles.startButtonText}>Démarrer le suivi</Text>
          </TouchableOpacity>
        </View>
      )}

      {screen === 'tracking' && (
        <View style={styles.dashboard}>
          <Text style={styles.speed}>
            {(getCurrentSpeed() * 3.6).toFixed(1)} km/h
          </Text>

          <View style={styles.metricsRow}>
            <Text style={styles.metric}>🧭 {getInclinaison()}°</Text>
            <Text style={styles.metric}>
              🕒 {Math.floor(getElapsedTime() / 60)}:
              {(getElapsedTime() % 60).toString().padStart(2, '0')}
            </Text>
            <Text style={styles.metric}>
              📍 {getTotalDistance().toFixed(2)} km
            </Text>
          </View>

          <Text style={styles.metric}>⛰️ {getAltitude().toFixed(1)} m</Text>

          <TouchableOpacity style={styles.endButton} onPress={toggleRunning}>
            <Text style={styles.endButtonText}>Fin de la piste</Text>
          </TouchableOpacity>
        </View>
      )}

      {screen === 'end' && (
        <View style={styles.endDashboard}>
          <TextInput
            style={styles.input}
            placeholder="Nom de la piste"
            value={trackName}
            onChangeText={setTrackName}
          />
          <Button title="Envoyer" onPress={sendData} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  startButton: {
    backgroundColor: '#606C38',
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FEFAE0',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
    padding: 30,
  },
  stat: {
    fontSize: 20,
    color: '#283618',
    textAlign: 'center',
  },
  endButton: {
    backgroundColor: '#BC6C25',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 12,
    marginTop: 30,
  },
  endButtonText: {
    color: '#FEFAE0',
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 2,
    borderColor: '#DDA15E',
    padding: 12,
    borderRadius: 12,
    fontSize: 18,
    width: '100%',
    backgroundColor: '#283618',
    color: '#FEFAE0',
    fontWeight: '600',
  },
  dashboard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    marginTop: 20,
  },

  endDashboard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
    borderRadius: 16,
    width: '100%',
    marginTop: 20,
  },

  speed: {
    fontSize: 60,
    color: '#DDA15E', // accent
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },

  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
  },

  metric: {
    fontSize: 20,
    color: '#FEFAE0',
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 80,
  },
});
