import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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

  const animateTo = (value: number) => {
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
  };

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
  }, [visible]);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[styles.container, { height: animatedHeight }]}
      {...panResponder.panHandlers}
    >
      <View style={styles.indicator} />
      <View style={styles.content}>
        <Text style={styles.text}>Track ID: {trackId}</Text>
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
});
