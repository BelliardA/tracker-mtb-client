import { colors } from '@/app';
import { useAuth } from '@/context/AuthContext';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import TrackDetails, { TrackDetailsRef } from '../components/TrackDetails';

export default function Map() {
  const { authState } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [location, setLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shouldCenter, setShouldCenter] = useState(true);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const mapRef = useRef<MapView | null>(null);
  const trackDetailsRef = useRef<TrackDetailsRef>(null);

  // Reset centering timer whenever user interacts
  const handleUserInteraction = () => {
    setShouldCenter(false);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setShouldCenter(true);
    }, 60000);
  };

  // Focus and zoom the map to fit the entire track
  const handleTrackPress = (track: any) => {
    // Extract coordinates from the track
    setSelectedTrackId(track._id);
    const coords = track.sensors.gps.map((point: any) => ({
      latitude: point.latitude,
      longitude: point.longitude,
    }));
    if (coords.length > 0) {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  const fetchTracks = async () => {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_URL_SERVEUR_API_DEV}/session`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${authState?.token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();
      setTracks(data);
      console.log('🔄 Pistes chargées :', data.length);
    } catch (err) {
      console.error('❌ Erreur récupération pistes :', err);
    }
  };

  useEffect(() => {
    let subscriber: Location.LocationSubscription;

    const loadEverything = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setHasPermission(false);
          return;
        }
        setHasPermission(true);

        subscriber = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (location) => {
            setLocation(location.coords);
            if (shouldCenter) {
              mapRef.current?.animateCamera({
                center: {
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                },
                zoom: 16,
              });
            }
          }
        );

        await fetchTracks();
      } catch (error) {
        console.error('❌ Erreur chargement initial :', error);
      } finally {
        setLoading(false);
      }
    };

    loadEverything();

    return () => {
      if (subscriber) subscriber.remove();
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [shouldCenter]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text>Chargement des données...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        onTouchStart={handleUserInteraction}
        onPanDrag={handleUserInteraction}
        onPress={() => {
          if (selectedTrackId !== null) {
            trackDetailsRef.current?.closeSheet();
          }
        }}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: location?.latitude ?? 46.2044,
          longitude: location?.longitude ?? 6.1432,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Vous êtes ici"
            pinColor="blue"
          />
        )}
        {tracks.map((track, index) => (
          <Polyline
            key={index}
            tappable
            onPress={() => handleTrackPress(track)}
            coordinates={track.sensors.gps.map((point: any) => ({
              latitude: point.latitude,
              longitude: point.longitude,
            }))}
            strokeColor={colors.secondary}
            strokeWidth={4}
          />
        ))}
      </MapView>
      <View style={styles.fabContainer}>
        <Text
          style={styles.fab}
          onPress={() => {
            // Redirection vers DataSender
            // Attention : nécessite que tu sois dans une navigation stack
            // et que DataSender soit bien déclaré comme screen
            // Si ce n’est pas le cas, tu peux remplacer ceci par un Router.push
            // ou équivalent selon ta structure
            router.push('/pages/DataSender');
          }}
        >
          +
        </Text>
      </View>
      {selectedTrackId != null && (
        <TrackDetails
          ref={trackDetailsRef}
          trackId={selectedTrackId}
          visible={selectedTrackId !== null}
          onClose={() => setSelectedTrackId(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  recenterButtonContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    elevation: 3,
  },
  recenterButton: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: colors.accent,
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  fab: {
    color: colors.background,
    fontSize: 48,
    lineHeight: 48,
    fontWeight: 'bold',
  },
});
