import { colors } from '@/app/styles/colors';
import { useAuth } from '@/context/AuthContext';
import useApi from '@/hooks/useApi';
import * as Location from 'expo-location';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import TrackDetails, { TrackDetailsRef } from '../components/TrackDetails';

export default function Map() {
  const { fetchWithAuth } = useApi();
  const { authState, refreshAuthFromStorage } = useAuth();

  const [location, setLocation] =
    useState<Location.LocationObjectCoords | null>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [shouldCenter, setShouldCenter] = useState(true);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  const mapRef = useRef<MapView | null>(null);
  const trackDetailsRef = useRef<TrackDetailsRef | null>(null);

  const params = useLocalSearchParams<{ trackId?: string }>();
  const pendingTrackIdRef = useRef<string | null>(
    typeof params.trackId === 'string' ? params.trackId : null
  );

  // Reset centering timer whenever user interacts
  const handleUserInteraction = () => {
    setShouldCenter(false);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setShouldCenter(true);
    }, 60000);
  };

  // Focus and zoom the map to fit the entire track
  const handleTrackPress = async (track: any) => {
    const selectAndZoom = () => {
      setSelectedTrackId(track._id);
      const coords = track.sensors.gps.map((point: any) => ({
        latitude: point.coords.latitude,
        longitude: point.coords.longitude,
      }));
      if (coords.length > 0) {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    };

    if (selectedTrackId && selectedTrackId !== track._id) {
      // Close the current sheet first, then open the new one
      if (trackDetailsRef.current?.closeSheetAsync) {
        await trackDetailsRef.current.closeSheetAsync();
        selectAndZoom();
      } else {
        // Fallback: close immediately, then switch
        trackDetailsRef.current?.closeSheet?.();
        setTimeout(selectAndZoom, 320);
      }
    } else {
      selectAndZoom();
    }
  };

  const fetchTracks = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/session');

      if (data && Array.isArray(data)) {
        setTracks(data);
        console.log('🔄 Pistes chargées :', data.length);
        // Ouvrir automatiquement une piste spécifique si demandée via navigation
        try {
          const wanted = pendingTrackIdRef.current;
          if (wanted) {
            const track = data.find((t: any) => t._id === wanted);
            if (track) {
              setSelectedTrackId(track._id);
              const coords = track.sensors.gps.map((p: any) => ({
                latitude: p.coords.latitude,
                longitude: p.coords.longitude,
              }));
              if (coords.length > 0) {
                mapRef.current?.fitToCoordinates(coords, {
                  edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
                  animated: true,
                });
              }
            }
            // Consommation one-shot
            pendingTrackIdRef.current = null;
          }
        } catch {}
      } else {
        console.warn('⚠️ Données inattendues pour les pistes :', data);
      }
    } catch (err) {
      console.error('❌ Erreur récupération pistes :', err);
    }
  }, []);

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

  useEffect(() => {
    let subscriber: Location.LocationSubscription;

    const loadEverything = async () => {
      if (!authState?.authenticated || !authState?.token) {
        setLoading(false);
        return;
      }
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return;
        }

        subscriber = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (location) => {
            setLocation(location.coords);
            if (shouldCenter && selectedTrackId == null) {
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
  }, [shouldCenter, fetchTracks, authState?.authenticated, authState?.token]);

  useEffect(() => {
    if (typeof params.trackId === 'string') {
      pendingTrackIdRef.current = params.trackId;

      if (tracks.length > 0) {
        const track = tracks.find((t) => t._id === params.trackId);
        if (track) {
          setSelectedTrackId(track._id);
          const coords = track.sensors.gps.map((p: any) => ({
            latitude: p.coords.latitude,
            longitude: p.coords.longitude,
          }));
          if (coords.length > 0) {
            mapRef.current?.fitToCoordinates(coords, {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true,
            });
          }
          pendingTrackIdRef.current = null;
        }
      }
    }
  }, [params.trackId, tracks]);

  if (authState?.loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text>Chargement de l’authentification…</Text>
      </View>
    );
  }

  if (!authState?.loading && (!authState?.authenticated || !authState?.token)) {
    return <Redirect href="/pages/Login" />;
  }

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
        onPress={(e) => {
          // If we're switching tracks via polyline tap, polyline's onPress will handle it.
          // Default tap on empty map closes the sheet.
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
              latitude: point.coords.latitude,
              longitude: point.coords.longitude,
            }))}
            strokeColor={colors.background}
            strokeWidth={4}
          />
        ))}
      </MapView>
      <View style={styles.profileButtonContainer}>
        <Text
          style={styles.profileButton}
          onPress={() => {
            router.push('/pages/Profile');
          }}
        >
          👤
        </Text>
      </View>
      <View style={styles.fabContainer}>
        <Text
          style={styles.fab}
          onPress={() => {
            router.push('/pages/DataSender');
          }}
        >
          +
        </Text>
      </View>
      {selectedTrackId != null && (
        <TrackDetails
          ref={trackDetailsRef}
          key={selectedTrackId}
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
  profileButtonContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: colors.background,
    borderRadius: 50,
    padding: 10,
    elevation: 4,
  },
  profileButton: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
