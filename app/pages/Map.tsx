import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { useAuth } from '@/context/AuthContext';

export default function Map() {
  const { authState } = useAuth(); // 👈 Récupère le token

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [location, setLocation] =
    useState<Location.LocationObjectCoords | null>(null);

  const [tracks, setTracks] = useState<any[]>([]);

  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    const fetchTracks = async () => {
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_URL_SERVEUR_API_DEV}/session`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${authState?.token}`, // 👈 Ajout du token
              'Content-Type': 'application/json',
            },
          }
        );
        const data = await response.json();
        setTracks(data);
      } catch (err) {
        console.error('❌ Erreur récupération pistes :', err);
      }
    };
    // Récupération des pistes à l'initialisation
    fetchTracks();
  }, []);

  useEffect(() => {
    (async () => {
      if (hasPermission) {
        if (tracks.length > 0 && mapRef.current) {
          const firstTrack = tracks[0];
          const firstPoint = firstTrack.sensors.gps?.[0];
          if (firstPoint?.latitude && firstPoint?.longitude) {
            mapRef.current.animateCamera({
              center: {
                latitude: firstPoint.latitude,
                longitude: firstPoint.longitude,
              },
              zoom: 15,
            });
            return;
          }
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(loc.coords);
        mapRef.current?.animateCamera({
          center: {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          },
          zoom: 15,
        });
      }
    })();
  }, [hasPermission, tracks]);

  useEffect(() => {
    if (tracks.length > 0 && mapRef.current) {
      const firstTrack = tracks[0];
      const firstPoint = firstTrack.sensors.gps?.[0];
      if (firstPoint?.latitude && firstPoint?.longitude) {
        mapRef.current.animateCamera({
          center: {
            latitude: firstPoint.latitude,
            longitude: firstPoint.longitude,
          },
          zoom: 15,
        });
      }
    }
  }, [tracks]);

  if (hasPermission === null) return <Text>Demande de permission...</Text>;
  if (!hasPermission) return <Text>Permission refusée</Text>;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: location?.latitude ?? 46.2044,
          longitude: location?.longitude ?? 6.1432,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      />
      {tracks.map((track, index) => (
        <Polyline
          key={index}
          coordinates={track.sensors.gps.map((point: any) => ({
            latitude: point.latitude,
            longitude: point.longitude,
          }))}
          strokeColor="#FFFF00"
          strokeWidth={3}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
