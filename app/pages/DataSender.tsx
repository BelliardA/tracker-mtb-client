import React, { useState } from "react";
import {ScrollView, View, Text, Button } from "react-native";
import Barometre from "../components/dataGetter/Barometre";
import Gyro from "../components/dataGetter/Gyroscope";
import Accelerometre from "../components/dataGetter/Accelerometre";
import Localisation from "../components/dataGetter/Location";
import { AccelerometerMeasurement, BarometerMeasurement, GyroscopeMeasurement } from "expo-sensors";
import { LocationData } from "../components/dataGetter/Location";

export default function DataSender() {
  const [isRunning, setIsRunning] = useState(false);

  const [trackGyro, setTrackGyro] = useState<GyroscopeMeasurement[]>([]);
  const [trackBaro, setTrackBaro] = useState<BarometerMeasurement[]>([]);
  const [trackAccel, setTrackAccel] = useState<AccelerometerMeasurement[]>([]);
    const [trackLocation, setTrackLocation] = useState<LocationData[]>([]);

  const toggleRunning = () => {
    setIsRunning(!isRunning);
  };

  const resetTrack = () => {
    setTrackGyro([]);
    setTrackBaro([]);
    setTrackAccel([]);
    setTrackLocation([]);
  };

  console.log("✅ DataSender component rendered");

  return (
    <View style={{ flex: 1, flexDirection: "row", padding: 10 }}>
      {/* Colonne gauche : boutons */}
      <View style={{ width: 150, justifyContent: "flex-start", gap: 10 }}>
        <Button onPress={toggleRunning} title="Start le track" />
        <Button onPress={resetTrack} title="Reset Track" />
      </View>
  
      
      <ScrollView style={{ flex: 1, paddingLeft: 20 }}>

        <Localisation isRunning={isRunning} setTrack={setTrackLocation} />
        <Text style={{ fontWeight: "bold", marginTop: 10 }}>Location Data:</Text>
        {trackLocation.map((data, index) => (
          <Text key={index}>
            Latitude: {data.coords.latitude}, Longitude: {data.coords.longitude}, Altitude: {data.coords.altitude} m, Speed : {data.coords.speed} m/s
            ------
          </Text>
        ))}
  
        {/* Composants pour les capteurs */}


        {/* <Accelerometre isRunning={isRunning} setTrack={setTrackAccel} /> */}
  
        <Text style={{ fontWeight: "bold", marginTop: 10 }}>Accelerometer Data:</Text>
        {trackAccel.map((data, index) => (
          <Text key={index}>
            x: {data.x.toFixed(3)}, y: {data.y.toFixed(3)}, z: {data.z.toFixed(3)}
          </Text>
        ))}
  
        {/* <Barometre isRunning={isRunning} setTrack={setTrackBaro} /> */}
        <Text style={{ fontWeight: "bold", marginTop: 10 }}>Barometer Data:</Text>
        {trackBaro.map((data, index) => (
          <Text key={index}>
            Pressure: {data.pressure.toFixed(3)} hPa, Relative Altitude:{" "}
            {data.relativeAltitude?.toFixed(3)} m
          </Text>
        ))}
  
        {/* <Gyro isRunning={isRunning} setTrack={setTrackGyro} /> */}
        <Text style={{ fontWeight: "bold", marginTop: 10 }}>Gyroscope Data:</Text>
        {trackGyro.map((data, index) => (
          <Text key={index}>
            x: {data.x.toFixed(3)}, y: {data.y.toFixed(3)}, z: {data.z.toFixed(3)}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}
