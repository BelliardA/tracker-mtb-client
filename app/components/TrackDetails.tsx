import { useAuth } from '@/context/AuthContext';
import useApi from '@/hooks/useApi';
import type { GPSData, Session as SessionDTO } from '@/types/session';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Linking,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Circle,
  Defs,
  LinearGradient,
  Polyline,
  Rect,
  Stop,
  Svg,
} from 'react-native-svg';
import { Coordinates, getDistance } from '../utils/distanceCalculate';

interface UserProfileDTO {
  _id: string;
  nickname: string;
  profilePictureUrl?: string; // URL
}

interface TrackDetailsProps {
  visible: boolean;
  trackId: string | null;
  onClose: () => void;
}

type DifficultyLabel = 'simple' | 'moyen' | 'difficile' | 'extrême';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const SNAP_TOP = SCREEN_HEIGHT * 0.85;
const SNAP_MIDDLE = SCREEN_HEIGHT * 0.4;
const SNAP_CLOSED = 0;

export interface TrackDetailsRef {
  closeSheet: () => void;
  closeSheetAsync: () => Promise<void>;
}

/** Map score (0-100) -> difficulty label for UI */
function mapScoreToDifficulty(score?: number): DifficultyLabel | undefined {
  if (typeof score !== 'number') return undefined;
  if (score < 25) return 'simple';
  if (score < 55) return 'moyen';
  if (score < 80) return 'difficile';
  return 'extrême';
}
function difficultyColor(label: DifficultyLabel | undefined) {
  switch (label) {
    case 'extrême':
      return '#111827'; // noir
    case 'difficile':
      return '#b91c1c'; // rouge
    case 'moyen':
      return '#2563eb'; // bleu
    case 'simple':
      return '#22c55e'; // vert
    default:
      return '#606C38'; // fallback
  }
}

function findMaxIndex(arr: number[]): number {
  if (!arr.length) return -1;
  let idx = 0;
  for (let i = 1; i < arr.length; i++) if (arr[i] > arr[idx]) idx = i;
  return idx;
}

/** Build elevation profile from GPS */
function useElevationProfile(gps: GPSData[] | undefined) {
  return useMemo(() => {
    if (!gps || gps.length === 0)
      return {
        distances: [] as number[],
        elevations: [] as number[],
        distAtIndex: [] as number[],
        startAlt: 0,
        endAlt: 0,
        maxIdx: -1,
      };

    const points: { d: number; z: number }[] = [];
    let cum = 0;
    for (let i = 0; i < gps.length; i++) {
      const a = gps[i];
      const alt = a.coords.altitude ?? 0;
      if (i === 0) {
        points.push({ d: 0, z: alt });
        continue;
      }
      const b = gps[i - 1];
      const seg = getDistance(
        { latitude: b.coords.latitude, longitude: b.coords.longitude },
        { latitude: a.coords.latitude, longitude: a.coords.longitude }
      );
      cum += seg; // meters
      points.push({ d: cum, z: alt });
    }

    // Downsample to ~80 points for smooth drawing
    const MAX_PTS = 80;
    const step = Math.max(1, Math.floor(points.length / MAX_PTS));
    const sampled = points.filter((_, idx) => idx % step === 0);

    const elevations = sampled.map((p) => p.z ?? 0);
    const distances = sampled.map((p) => p.d);
    const maxIdx = findMaxIndex(elevations);

    return {
      distances,
      elevations,
      distAtIndex: distances,
      startAlt: elevations[0] ?? 0,
      endAlt: elevations[elevations.length - 1] ?? 0,
      maxIdx,
    };
  }, [gps]);
}

/** 2D elevation chart + légendes + marqueurs */
const ElevationChart: React.FC<{
  distances: number[];
  elevations: number[];
  startAlt: number;
  endAlt: number;
  maxIdx: number;
  steepSpans?: { from: number; to: number }[];
  gutterLeft?: number;
}> = ({
  distances,
  elevations,
  startAlt,
  endAlt,
  maxIdx,
  steepSpans,
  gutterLeft,
}) => {
  const height = 140;
  const gutter = typeof gutterLeft === 'number' ? gutterLeft : 36;
  const width = SCREEN_WIDTH - 32 - gutter;

  if (!distances.length || !elevations.length) {
    return (
      <View style={styles.chartEmpty}>
        <Text style={styles.chartEmptyText}>Profil indisponible</Text>
      </View>
    );
  }

  const minZ = Math.min(...elevations);
  const maxZ = Math.max(...elevations);
  const spanZ = Math.max(1, maxZ - minZ);
  const maxD = distances[distances.length - 1] || 1;

  const xAt = (d: number) => (d / maxD) * width;
  const yAtIdx = (i: number) =>
    height - ((elevations[i] - minZ) / spanZ) * height;

  const points = distances
    .map((d, i) => `${xAt(d).toFixed(2)},${yAtIdx(i).toFixed(2)}`)
    .join(' ');

  const startIdx = 0;
  const endIdx = distances.length - 1;
  const highestIdx = maxIdx >= 0 ? maxIdx : 0;

  // segments rouges pour pentes raides
  const redSegments: string[] = [];
  if (steepSpans?.length) {
    for (const seg of steepSpans) {
      const pts: string[] = [];
      for (let i = 0; i < distances.length; i++) {
        const d = distances[i];
        if (d >= seg.from && d <= seg.to) {
          pts.push(`${xAt(d).toFixed(2)},${yAtIdx(i).toFixed(2)}`);
        }
      }
      if (pts.length > 1) redSegments.push(pts.join(' '));
    }
  }

  const yStart = yAtIdx(startIdx);
  const yEnd = yAtIdx(endIdx);

  return (
    <View
      style={{
        width: width + gutter,
        height,
        position: 'relative',
      }}
    >
      {/* Vertical guide line in gutter */}
      <View
        style={{
          position: 'absolute',
          left: gutter / 2 - 1,
          top: 0,
          bottom: 0,
          width: 2,
          backgroundColor: '#E5E7EB',
        }}
      />
      {/* Start altitude label */}
      <Text
        style={[
          styles.axisLabel,
          { top: Math.max(0, Math.min(height - 16, yStart - 8)) },
        ]}
      >
        {Math.round(startAlt)} m
      </Text>
      {/* End altitude label */}
      <Text
        style={[
          styles.axisLabel,
          { top: Math.max(0, Math.min(height - 16, yEnd - 8)) },
        ]}
      >
        {Math.round(endAlt)} m
      </Text>
      {/* SVG chart shifted by gutter */}
      <View style={{ position: 'absolute', left: gutter, top: 0 }}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#606C38" stopOpacity="0.35" />
              <Stop offset="1" stopColor="#283618" stopOpacity="0.05" />
            </LinearGradient>
          </Defs>

          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="url(#grad)"
            rx={16}
          />
          <Polyline
            points={points}
            fill="none"
            stroke="#283618"
            strokeWidth={2}
          />

          {redSegments.map((seg, i) => (
            <Polyline
              key={i}
              points={seg}
              fill="none"
              stroke="#b91c1c"
              strokeWidth={3}
            />
          ))}

          {/* Highest point only */}
          <Circle
            cx={xAt(distances[highestIdx])}
            cy={yAtIdx(highestIdx)}
            r={5}
            fill="#111827"
          />
        </Svg>
      </View>
    </View>
  );
};

const ElevationLegend: React.FC = () => (
  <View style={styles.legendRow}>
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
      <Text style={styles.legendText}>départ</Text>
    </View>
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: '#2563eb' }]} />
      <Text style={styles.legendText}>arrivée</Text>
    </View>
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: '#111827' }]} />
      <Text style={styles.legendText}>point haut</Text>
    </View>
    <View style={styles.legendItem}>
      <View style={[styles.legendDash]} />
      <Text style={styles.legendText}>pente raide</Text>
    </View>
  </View>
);

function TrackDetailsInner(
  { visible, trackId, onClose }: TrackDetailsProps,
  ref: React.Ref<TrackDetailsRef>
) {
  const animatedHeight = useRef(new Animated.Value(SNAP_CLOSED)).current;
  const closeResolvers = useRef<Array<() => void>>([]);
  const lastSnapPoint = useRef(SNAP_CLOSED);
  const [isVisible, setIsVisible] = useState(false);
  const [session, setSession] = useState<SessionDTO | null>(null);
  const [author, setAuthor] = useState<UserProfileDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { authState } = useAuth();
  const api = useApi();

  // Fetch the track
  useEffect(() => {
    let alive = true;
    const fetchTrack = async () => {
      if (!trackId) return;
      setLoading(true);
      setError(null);
      try {
        const s: SessionDTO = await api.fetchWithAuth(`/session/${trackId}`);
        if (!alive) return;
        setSession(s);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchTrack();
    return () => {
      alive = false;
    };
  }, [trackId, authState?.token]);

  useEffect(() => {
    let alive = true;
    const loadAuthor = async () => {
      try {
        if (!session?.userId) {
          if (alive) setAuthor(null);
          return;
        }
        // useApi may return either `{ data }` or the raw payload; support both
        const data: any = await api.fetchWithAuth(`/users/${session.userId}`);
        if (!alive) return;
        if (data) {
          setAuthor({
            _id: data._id || data.id || '',
            nickname: data.nickname || 'Utilisateur',
            profilePictureUrl: data.profilePictureUrl,
          });
        } else {
          setAuthor(null);
        }
      } catch (e) {
        if (alive) {
          console.warn('Impossible de charger le profil auteur', e);
          setAuthor(null);
        }
      }
    };

    loadAuthor();
    return () => {
      alive = false;
    };
  }, [session?.userId]);

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
          const resolver = closeResolvers.current.shift();
          if (resolver) resolver();
        }
      });
    },
    [animatedHeight, onClose]
  );

  useImperativeHandle(ref, () => ({
    closeSheet: () => animateTo(SNAP_CLOSED),
    closeSheetAsync: () =>
      new Promise<void>((resolve) => {
        closeResolvers.current.push(resolve);
        animateTo(SNAP_CLOSED);
      }),
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
      if (!isVisible) setIsVisible(true);
      // Snap to middle only if we were closed
      if (lastSnapPoint.current === SNAP_CLOSED) {
        animateTo(SNAP_MIDDLE);
      }
    } else {
      if (lastSnapPoint.current !== SNAP_CLOSED) {
        animateTo(SNAP_CLOSED);
      }
    }
  }, [visible, isVisible, animateTo]);

  const handleRidePress = async () => {
    if (!session) return;
    if (!session.startTrack) {
      console.warn('Point de départ indisponible');
      return;
    }

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

  // Profil altitude + repères
  const { distances, elevations, distAtIndex, startAlt, endAlt, maxIdx } =
    useElevationProfile(session?.sensors?.gps);

  // Distances des segments de pente raide (rouge)
  const slopeSpans = useMemo(() => {
    const segs = session?.analysis?.slopes ?? [];
    if (!segs.length) return [] as { from: number; to: number }[];
    return segs
      .filter((s) => s.level !== 'moderee')
      .map((s) => {
        const fromD = distAtIndex[s.startIdx] ?? 0;
        const toD =
          distAtIndex[Math.min(s.endIdx, distAtIndex.length - 1)] ?? fromD;
        return { from: Math.min(fromD, toD), to: Math.max(fromD, toD) };
      });
  }, [session, distAtIndex]);

  // approx : map timestamp -> distance (indice GPS le plus proche)
  function timeToDist(ts: number): number | null {
    const gps = session?.sensors?.gps ?? [];
    if (!gps.length) return null;
    let best = 0,
      bestDiff = Infinity;
    for (let i = 0; i < gps.length; i++) {
      const d = Math.abs(gps[i].timestamp - ts);
      if (d < bestDiff) {
        bestDiff = d;
        best = i;
      }
    }
    return distAtIndex[best] ?? null;
  }

  const analysis = session?.analysis;

  const goToAuthorProfile = useCallback(() => {
    if (!author?._id) return;
    router.push({ pathname: '/pages/Profile', params: { userId: author._id } });
  }, [author?._id]);

  if (!isVisible) return null;

  const difficultyLabel = mapScoreToDifficulty(
    session?.analysis?.difficulty?.score
  );
  const difficultyBg = difficultyColor(difficultyLabel);

  return (
    <Animated.View
      style={[styles.container, { height: animatedHeight }]}
      {...panResponder.panHandlers}
    >
      <View style={styles.indicator} />

      <View style={styles.content}>
        {/* Titre en haut */}
        <Text style={styles.trackTitle}>
          {session?.name ?? `Track ID: ${trackId}`}
        </Text>

        {/* Header: elevation profile + meta */}
        <View style={styles.headerRow}>
          <ElevationChart
            distances={distances}
            elevations={elevations}
            startAlt={startAlt}
            endAlt={endAlt}
            maxIdx={maxIdx}
            steepSpans={slopeSpans}
            gutterLeft={36}
          />
          <ElevationLegend />
          <View style={styles.metaBox}>
            {author?.profilePictureUrl && author?.nickname ? (
              <Pressable
                onPress={goToAuthorProfile}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
              >
                <Image
                  source={{ uri: author.profilePictureUrl }}
                  style={styles.avatar}
                />
                <Text style={styles.authorLink}>{author.nickname}</Text>
              </Pressable>
            ) : (
              <View
                style={[
                  styles.avatar,
                  { alignItems: 'center', justifyContent: 'center' },
                ]}
              >
                <Text style={{ color: '#9CA3AF', fontWeight: '700' }}>?</Text>
              </View>
            )}

            <View style={styles.badgeRow}>
              <View style={[styles.badge, styles.badgeDistance]}>
                <Text style={styles.badgeText}>
                  {session?.totalDistance?.toFixed(1)} km
                </Text>
              </View>
              {difficultyLabel ? (
                <View style={[styles.badge, { backgroundColor: difficultyBg }]}>
                  <Text style={styles.badgeText}>{difficultyLabel}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Loading & error */}
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator />
            <Text style={styles.loadingTxt}>Chargement…</Text>
          </View>
        )}
        {error && <Text style={styles.errorTxt}>❌ {error}</Text>}

        {/* Analysis cards */}
        {analysis && (
          <View style={styles.cardsRow}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sauts</Text>
              <Text style={styles.cardValue}>
                {analysis.jumps?.length ?? 0}
              </Text>
              <Text style={styles.cardSub}>
                dont gros:{' '}
                {analysis.jumps
                  ? analysis.jumps.filter((j) => j.size === 'gros').length
                  : 0}
              </Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Virages</Text>
              <Text style={styles.cardValue}>
                {analysis.turns?.length ?? 0}
              </Text>
              <Text style={styles.cardSub}>
                épingles:{' '}
                {analysis.turns
                  ? analysis.turns.filter((t) => (t.deltaYawDeg ?? 0) > 80)
                      .length
                  : 0}
              </Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Pentes</Text>
              <Text style={styles.cardValue}>
                {analysis.slopes?.length ?? 0}
              </Text>
              <Text style={styles.cardSub}>
                {(() => {
                  if (!analysis.slopes || analysis.slopes.length === 0)
                    return 'max: 0%';
                  const maxGrade = Math.max(
                    ...analysis.slopes.map((s) => Math.abs(s.gradePct))
                  );
                  return `max: ${Math.round(maxGrade)}%`;
                })()}
              </Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Score</Text>
              <Text style={styles.cardValue}>
                {typeof analysis.difficulty?.score === 'number'
                  ? Math.round(analysis.difficulty.score)
                  : '-'}
              </Text>
              <Text style={styles.cardSub}>
                {mapScoreToDifficulty(analysis.difficulty?.score) ?? ''}
              </Text>
            </View>
          </View>
        )}

        {/* CTA */}
        <Pressable
          onPress={handleRidePress}
          style={styles.ctaBtn}
          android_ripple={{ color: '#1f2713' }}
        >
          <Text style={styles.ctaText}>🚴 Rider ce chemin</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default forwardRef<TrackDetailsRef, TrackDetailsProps>(
  TrackDetailsInner
);

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
  content: { flex: 1, padding: 16, gap: 16 },
  headerRow: { gap: 16 },
  metaBox: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#eee' },
  authorLabel: { fontSize: 12, color: '#6b7280' },
  authorName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  authorLink: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  badgeRow: { flexDirection: 'row', gap: 10 },
  badge: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  badgeDistance: { backgroundColor: '#DDA15E' },
  badgeText: { color: 'white', fontWeight: '700' },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingTxt: { color: '#6b7280' },
  errorTxt: { color: '#b91c1c' },

  cardsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  card: {
    flexBasis: '48%',
    backgroundColor: '#F8FAF8',
    borderRadius: 14,
    padding: 14,
  },
  cardTitle: { color: '#374151', fontSize: 12, marginBottom: 4 },
  cardValue: { color: '#111827', fontSize: 22, fontWeight: '800' },
  cardSub: { color: '#6b7280', marginTop: 2 },

  trackTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },

  ctaBtn: {
    marginTop: 10,
    backgroundColor: '#283618',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: 'white', fontSize: 16, fontWeight: '700' },

  chartEmpty: {
    width: SCREEN_WIDTH - 32,
    height: 140,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartEmptyText: { color: '#6b7280' },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendDash: {
    width: 20,
    height: 2,
    backgroundColor: '#b91c1c',
  },
  legendText: { fontSize: 12, color: '#111827' },
  axisLabel: {
    position: 'absolute',
    left: 4,
    fontSize: 11,
    color: '#374151',
  },
});
