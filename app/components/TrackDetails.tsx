import { useAuth } from '@/context/AuthContext';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Dimensions,
  Linking,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Coordinates, getDistance } from '../utils/distanceCalculate';

interface TrackDetailsProps {
  visible: boolean;
  trackId: string | null;
  onClose: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SNAP_TOP = SCREEN_HEIGHT * 0.8;
const SNAP_MIDDLE = SCREEN_HEIGHT * 0.3;
const SNAP_CLOSED = 0;

export interface TrackDetailsRef {
  closeSheet: () => void;
}

function TrackDetailsInner(
  { visible, trackId, onClose }: TrackDetailsProps,
  ref: React.Ref<TrackDetailsRef>
) {
  const animatedHeight = useRef(new Animated.Value(SNAP_CLOSED)).current;
  const lastSnapPoint = useRef(SNAP_CLOSED);
  const [isVisible, setIsVisible] = useState(false);
  const [session, setSession] = useState<any | null>(null);

  const { authState } = useAuth();

  //Fetch la track
  useEffect(() => {
    const fetchTrack = async () => {
      if (!trackId) return;

      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_URL_SERVEUR_API_DEV}/session/${trackId}`,
          {
            headers: {
              Authorization: `Bearer ${authState?.token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch track data');
        }

        const session = await response.json();
        setSession(session);
      } catch (error) {
        console.error(
          '❌ Erreur lors de la récupération des données de la piste :',
          error
        );
      }
    };

    fetchTrack();
  }, [trackId, authState?.token]);

  const animateTo = useCallback(
    (value: number) => {
      Animated.timing(animatedHeight, {
        toValue: value,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        lastSnapPoint.current = value;
        if (value === SNAP_CLOSED) {
          setIsVisible(false);
          onClose();
        }
      });
    },
    [animatedHeight, onClose]
  );

  useImperativeHandle(ref, () => ({
    closeSheet: () => animateTo(SNAP_CLOSED),
  }));

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 10,
      onPanResponderMove: (_, gestureState) => {
        const newHeight = lastSnapPoint.current - gestureState.dy;
        animatedHeight.setValue(
          Math.max(SNAP_CLOSED, Math.min(SNAP_TOP, newHeight))
        );
      },
      onPanResponderRelease: (_, gestureState) => {
        const moved = lastSnapPoint.current - gestureState.dy;
        if (moved < (SNAP_MIDDLE + SNAP_CLOSED) / 2) {
          animateTo(SNAP_CLOSED);
        } else if (moved < (SNAP_TOP + SNAP_MIDDLE) / 2) {
          animateTo(SNAP_MIDDLE);
        } else {
          animateTo(SNAP_TOP);
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      animateTo(SNAP_MIDDLE);
    } else {
      animateTo(SNAP_CLOSED);
    }
  }, [visible, animateTo]);

  const handleRidePress = async () => {
    if (!session) {
      console.log('❌ Aucune session disponible pour démarrer la navigation');
    }
    if (!session.startTrack) {
      console.warn('point de départ disponible');
      return;
    }

    console.log('🚴‍♂️ Démarrage de la navigation vers le point de départ...');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission de localisation non accordée');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const userCoords: Coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      const startCoords: Coordinates = session.startTrack;
      const distance = getDistance(userCoords, startCoords);

      if (distance > 40) {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${startCoords.latitude},${startCoords.longitude}`;
        await Linking.openURL(url);
      } else {
        router.push('/pages/GoInTrack');
      }
    } catch (error) {
      console.error('Erreur lors de la localisation ou navigation :', error);
    }
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[styles.container, { height: animatedHeight }]}
      {...panResponder.panHandlers}
    >
      <View style={styles.indicator} />
      <View style={styles.content}>
        <Text style={styles.text}>Track ID: {trackId}</Text>
        <View style={{ marginTop: 20 }}>
          <Text style={styles.button} onPress={handleRidePress}>
            🚴 Rider ce chemin
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default forwardRef(TrackDetailsInner);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    zIndex: 1000,
  },
  indicator: {
    width: 50,
    height: 5,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    borderRadius: 2.5,
    marginVertical: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  text: {
    fontSize: 16,
  },
  button: {
    fontSize: 18,
    color: 'white',
    backgroundColor: '#283618',
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
