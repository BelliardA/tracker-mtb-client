import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Button } from 'react-native';
import Barometre from '../components/dataGetter/Barometre';
import Gyro from '../components/dataGetter/Gyroscope';
import Accelerometre from '../components/dataGetter/Accelerometre';
import Localisation from '../components/dataGetter/Location';
import {
  AccelerometerMeasurement,
  BarometerMeasurement,
  GyroscopeMeasurement,
} from 'expo-sensors';
import { LocationObject } from 'expo-location';
import * as FileSystem from 'expo-file-system';

export default function DataSender() {
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<string | null>(null);

  const [trackGyro, setTrackGyro] = useState<GyroscopeMeasurement[]>([]);
  const [trackBaro, setTrackBaro] = useState<BarometerMeasurement[]>([]);
  const [trackAccel, setTrackAccel] = useState<AccelerometerMeasurement[]>([]);
  const [trackLocation, setTrackLocation] = useState<LocationObject[]>([]);

  const STORAGE_PATH = FileSystem.documentDirectory + 'sessionBuffer.json';

  const toggleRunning = () => {
    if (!isRunning) {
      setStartTime(new Date().toISOString());
      setEndTime(null);
    } else {
      setEndTime(new Date().toISOString());
    }
    setIsRunning(!isRunning);
    console.log('isRunning:', !isRunning);
  };

  const resetTrack = () => {
    setStartTime(null);
    setEndTime(null);
    setTrackGyro([]);
    setTrackBaro([]);
    setTrackAccel([]);
    setTrackLocation([]);
  };

  const sendDataToServer = async () => {
    if (!startTime || !endTime) {
      console.warn('⛔ startTime or endTime missing');
      return;
    }

    const session = {
      name: 'Test Run',
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

    try {
      // adresse ip de l'ordinateur pour que expo Go puisse envoyer les données
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_URL_SERVEUR_API_DEV}/session`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(session),
        }
      );
      const result = await response.json();
      console.log('✅ Session envoyée :', result);
    } catch (error) {
      console.error("❌ Erreur d'envoi :", error);
    }
  };

  const saveDataOffline = async () => {
    if (!startTime || !endTime) return;

    const session = {
      name: 'Offline Run',
      startTime,
      endTime,
      notes: 'Session enregistrée hors-ligne',
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

    try {
      await FileSystem.writeAsStringAsync(
        STORAGE_PATH,
        JSON.stringify(session)
      );
      console.log('✅ Session sauvegardée localement');
    } catch (err) {
      console.error('❌ Erreur de sauvegarde offline :', err);
    }
  };

  const sendOfflineDataIfExists = async () => {
    const fileInfo = await FileSystem.getInfoAsync(STORAGE_PATH);
    //vérifie si un fichier est existant, sinon return
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

  return (
    <View style={{ flex: 1, flexDirection: 'row', padding: 10 }}>
      {/* Colonne gauche : boutons */}
      <View style={{ width: 150, justifyContent: 'flex-start', gap: 10 }}>
        <Button onPress={toggleRunning} title="Start le track" />
        <Button onPress={resetTrack} title="Reset Track" />
        <Button
          onPress={sendDataToServer}
          title="Envoyer la session"
          disabled={!startTime || !endTime || isRunning}
        />
        <Button
          onPress={saveDataOffline}
          title="Sauvegarder hors-ligne"
          disabled={!startTime || !endTime || isRunning}
        />
      </View>

      <ScrollView style={{ flex: 1, paddingLeft: 20 }}>
        <Localisation
          isRunning={isRunning}
          onLocationUpdate={(location) => {
            setTrackLocation((prev) => [...prev, location]);
          }}
          intervalMs={150} // ou la valeur que tu souhaites
        />
        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>
          Location Data:
        </Text>
        {trackLocation.map((data, index) => (
          <Text key={index}>
            Latitude: {data.coords.latitude}, Longitude: {data.coords.longitude}
            , Altitude: {data.coords.altitude} m, Speed : {data.coords.speed}{' '}
            m/s ------
          </Text>
        ))}

        {/* Composants pour les capteurs */}

        <Accelerometre isRunning={isRunning} setTrack={setTrackAccel} />

        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>
          Accelerometer Data:
        </Text>
        {trackAccel.map((data, index) => (
          <Text key={index}>
            x: {data.x.toFixed(3)}, y: {data.y.toFixed(3)}, z:{' '}
            {data.z.toFixed(3)}
          </Text>
        ))}

        <Barometre isRunning={isRunning} setTrack={setTrackBaro} />
        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>
          Barometer Data:
        </Text>
        {trackBaro.map((data, index) => (
          <Text key={index}>
            Pressure: {data.pressure.toFixed(3)} hPa, Relative Altitude:{' '}
            {data.relativeAltitude?.toFixed(3)} m
          </Text>
        ))}

        <Gyro isRunning={isRunning} setTrack={setTrackGyro} />
        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>
          Gyroscope Data:
        </Text>
        {trackGyro.map((data, index) => (
          <Text key={index}>
            x: {data.x.toFixed(3)}, y: {data.y.toFixed(3)}, z:{' '}
            {data.z.toFixed(3)}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}
