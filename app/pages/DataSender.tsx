import { useAuth } from '@/context/AuthContext';
import * as FileSystem from 'expo-file-system';
import { LocationObject } from 'expo-location';
import { useRouter } from 'expo-router';
import {
  AccelerometerMeasurement,
  BarometerMeasurement,
  GyroscopeMeasurement,
} from 'expo-sensors';
import React, { useEffect, useState } from 'react';
import {
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

export default function DataSender() {
  const { authState } = useAuth();
  const token = authState?.token;
  const router = useRouter();

  const [screen, setScreen] = useState<'start' | 'tracking' | 'end'>('start');

  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [trackName, setTrackName] = useState<string>('');

  const [trackGyro, setTrackGyro] = useState<GyroscopeMeasurement[]>([]);
  const [trackBaro, setTrackBaro] = useState<BarometerMeasurement[]>([]);
  const [trackAccel, setTrackAccel] = useState<AccelerometerMeasurement[]>([]);
  const [trackLocation, setTrackLocation] = useState<LocationObject[]>([]);

  const [initialInclinaison, setInitialInclinaison] = useState<number | null>(null);


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
    console.log("🚀 Envoi en cours...");
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
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          altitude: loc.coords.altitude,
          speed: loc.coords.speed,
          heading: loc.coords.heading,
        })),
      },
    };

    console.log('📦 Session à envoyer :', session);

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_URL_SERVEUR_API_DEV}/session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(session),
        }
      );

      const result = await response.json();
      console.log('✅ Session envoyée :', result);

      Alert.alert('Succès', 'Track envoyée !');
      router.replace('/pages/Map');
    } catch (error) {
      console.error("❌ Erreur d'envoi :", error);
      await FileSystem.writeAsStringAsync(STORAGE_PATH, JSON.stringify(session));
      Alert.alert(
        'Sauvegarde locale',
        'Track enregistrée hors-ligne. Elle sera envoyée plus tard.'
      );
      router.replace('/pages/Map');
    }
  };

  const sendOfflineDataIfExists = async () => {
    const fileInfo = await FileSystem.getInfoAsync(STORAGE_PATH);
    if (!fileInfo.exists) return;

    try {
      const content = await FileSystem.readAsStringAsync(STORAGE_PATH);
      const session = JSON.parse(content);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_URL_SERVEUR_API_DEV}/session`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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

  useEffect(() => {
    sendOfflineDataIfExists();
  }, []);

  const getCurrentSpeed = () => {
    const latest = trackLocation.at(-1);
    return latest?.coords.speed || 0;
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

    const angle = Math.atan2(latest.x, latest.z) * (180 / Math.PI);
    if (initialInclinaison === null) {
      setInitialInclinaison(angle);
    }

    return Math.round(angle - (initialInclinaison ?? angle));
  };

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
        <TouchableOpacity style={styles.startButton} onPress={toggleRunning}>
          <Text style={styles.startButtonText}>Démarrer le suivi</Text>
        </TouchableOpacity>
      )}

      {screen === 'tracking' && (
        <>
          <View style={styles.statsContainer}>
            <Text style={styles.stat}>Vitesse : {(getCurrentSpeed() * 3.6).toFixed(1)} km/h</Text>
            <Text style={styles.stat}>Altitude : {getAltitude().toFixed(1)} m</Text>
            <Text style={styles.stat}>Temps : {getElapsedTime()} s</Text>
            <Text style={styles.stat}>Inclinaison : {getInclinaison()}°</Text>
          </View>
          <TouchableOpacity style={styles.endButton} onPress={toggleRunning}>
            <Text style={styles.endButtonText}>Fin de la piste</Text>
          </TouchableOpacity>
        </>
      )}

      {screen === 'end' && (
        <View style={styles.endContainer}>
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
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
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
  endContainer: {
    width: '100%',
    gap: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#606C38',
    padding: 10,
    borderRadius: 8,
    fontSize: 18,
    width: '100%',
    backgroundColor: 'white',
  },
});
