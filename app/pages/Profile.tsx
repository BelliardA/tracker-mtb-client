import { formatDistance } from '@/app/utils/adaptDistance';
import { useAuth } from '@/context/AuthContext';
import useApi from '@/hooks/useApi';
import { User } from '@/types/user';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ChevronDownIcon,
  ChevronUpIcon,
  Pencil,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import EditProfileModal from '../components/user/EditProfileModal';
import SessionByUser from '../components/user/SessionByUser';

// Helper to safely render optional values
const display = (v?: string | number | null) =>
  v === null || v === undefined || v === '' ? '--' : String(v);

export default function Profile() {
  const params = useLocalSearchParams<{ userId?: string }>();
  const viewedUserId =
    typeof params.userId === 'string' ? params.userId : undefined;
  const viewingOther = !!viewedUserId;
  const { authState, onLogout, refreshAuthFromStorage } = useAuth();
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
  const { fetchWithAuth } = useApi();
  const router = useRouter();
  const [user, setUser] = useState<User>({
    _id: '',
    email: '',
    firstName: '',
    lastName: '',
    nickname: '',
    bikeBrand: '',
    bikeModel: '',
    totalRides: 0,
    totalDistance: 0,
    bestTrackTime: { sessionId: '', time: 0 },
  } as User);
  const [loading, setLoading] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              setLogoutLoading(true);
              if (onLogout) {
                await onLogout();
              }
            } catch (e) {
              console.error('❌ Erreur lors de la déconnexion :', e);
            } finally {
              setLogoutLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  useEffect(() => {
    async function load() {
      try {
        if (!viewingOther) {
          await fetchWithAuth('/users/me/stats', { method: 'POST' });
          const profile = await fetchWithAuth('/users/me');
          setUser(profile as User);
        } else if (viewedUserId) {
          // 1) Fetch public profile of another user
          const profile = (await fetchWithAuth(
            `/users/${viewedUserId}`
          )) as User;

          // 2) Try to fetch that user's stats (server should expose GET /users/:id/stats)
          //    If the route does not exist yet, this will be caught and we will still display the profile.
          try {
            const stats = await fetchWithAuth(`/users/${viewedUserId}/stats`);
            // Expected shape: { totalRides: number, totalDistance: number, bestTrackTime?: { sessionId: string, time: number } }
            setUser({
              ...profile,
              totalRides:
                typeof stats?.totalRides === 'number'
                  ? stats.totalRides
                  : (profile.totalRides ?? 0),
              totalDistance:
                typeof stats?.totalDistance === 'number'
                  ? stats.totalDistance
                  : (profile.totalDistance ?? 0),
              bestTrackTime:
                stats?.bestTrackTime &&
                typeof stats.bestTrackTime?.time === 'number'
                  ? stats.bestTrackTime
                  : (profile.bestTrackTime ?? { sessionId: '', time: 0 }),
            } as User);
          } catch (e) {
            // If stats route isn't available, fall back to profile-only data
            setUser(profile as User);
          }
        }
        setLoadError(null);
      } catch (err) {
        console.error('❌ Erreur de chargement du profil :', err);
        setLoadError('Impossible de charger le profil.');
      } finally {
        setLoading(false);
      }
    }

    if (authState?.token) {
      load();
    }
  }, [authState?.token, viewingOther, viewedUserId]);

  if (authState?.loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#888" />
        <Text style={{ color: '#fff', marginTop: 12 }}>
          Chargement de l’authentification…
        </Text>
      </View>
    );
  }

  if (!authState?.loading && (!authState?.authenticated || !authState?.token)) {
    return <Redirect href="/pages/Login" />;
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#888" />
        {loadError ? (
          <>
            <Text style={{ color: '#fff', marginTop: 12 }}>{loadError}</Text>
            <TouchableOpacity
              onPress={() => {
                setLoading(true);
                setLoadError(null);
                // relance du chargement
                (async () => {
                  try {
                    if (!viewingOther) {
                      await fetchWithAuth('/users/me/stats', {
                        method: 'POST',
                      });
                      const profile = await fetchWithAuth('/users/me');
                      setUser(profile as User);
                    } else if (viewedUserId) {
                      const profile = await fetchWithAuth(
                        `/users/${viewedUserId}`
                      );
                      setUser(profile as User);
                    }
                    setLoadError(null);
                  } catch (e) {
                    setLoadError('Impossible de charger le profil.');
                  } finally {
                    setLoading(false);
                  }
                })();
              }}
              style={{
                marginTop: 10,
                backgroundColor: '#BC6C25',
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>
                Réessayer
              </Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 10, left: 20, zIndex: 20 }}
            onPress={() => router.back()}
            accessibilityLabel="Retour à la carte"
          >
            <ArrowLeft color="#fff" size={32} />
          </TouchableOpacity>
          <View style={styles.header}>
            {user.profilePictureUrl ? (
              <Image
                source={{ uri: user.profilePictureUrl }}
                style={styles.avatarLarge}
              />
            ) : null}
            <Text style={styles.nickname}>{user.nickname}</Text>
            <Text style={styles.bike}>
              {user.bikeBrand} {user.bikeModel}
            </Text>
          </View>
          {!viewingOther && (
            <TouchableOpacity
              style={{ position: 'absolute', top: 10, right: 20 }}
              onPress={() => setEditVisible(true)}
              accessibilityLabel="Modifier mon profil"
            >
              <Pencil color="#fff" size={24} />
            </TouchableOpacity>
          )}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Statistiques</Text>
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{user.totalRides || 0}</Text>
                <Text style={styles.statLabel}>Rides</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>
                  {typeof user.totalDistance === 'number'
                    ? formatDistance(user.totalDistance)
                    : '--'}
                </Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statVal}>
                  {typeof user.bestTrackTime?.time === 'number'
                    ? `${user.bestTrackTime.time} s`
                    : '--'}
                </Text>
                <Text style={styles.statLabel}>Best Run</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Pressable
              style={styles.depliantHeader}
              onPress={() => setInfoOpen(!infoOpen)}
            >
              <Text style={styles.sectionTitle}>Informations personnelles</Text>
              {infoOpen ? (
                <ChevronUpIcon color="#fff" size={20} />
              ) : (
                <ChevronDownIcon color="#fff" size={20} />
              )}
            </Pressable>
            <Animated.View
              style={[
                {
                  overflow: 'hidden',
                  height: infoOpen ? undefined : 0,
                  opacity: infoOpen ? 1 : 0,
                  transform: [{ scaleY: infoOpen ? 1 : 0.95 }],
                  transitionProperty: 'all',
                  transitionDuration: '300ms',
                },
                {
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  marginTop: 10,
                },
              ]}
            >
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Nom</Text>
                <Text style={styles.infoValue}>{display(user.lastName)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Prénom</Text>
                <Text style={styles.infoValue}>{display(user.firstName)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Âge</Text>
                <Text style={styles.infoValue}>{display(user.age)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Genre</Text>
                <Text style={styles.infoValue}>{display(user.gender)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Type</Text>
                <Text style={styles.infoValue}>{display(user.bikeType)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Style</Text>
                <Text style={styles.infoValue}>
                  {display(user.ridingStyle)}
                </Text>
              </View>
            </Animated.View>
          </View>
          {/* Only allow deletion for the owner (current viewer = owner).
              We pass a hint prop `canDelete` for the child to decide whether to render delete actions. */}
          <SessionByUser userId={user._id} canDelete={!viewingOther} />

          {!viewingOther && (
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              disabled={logoutLoading}
            >
              {logoutLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.logoutText}>Se déconnecter</Text>
              )}
            </TouchableOpacity>
          )}

          {!viewingOther && (
            <EditProfileModal
              visible={editVisible}
              user={user}
              onClose={() => setEditVisible(false)}
              onSaved={(updated) => {
                setUser((prev) => ({ ...prev, ...(updated || {}) }));
                setEditVisible(false);
              }}
            />
          )}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 50,
  },
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'column', alignItems: 'center', marginBottom: 20 },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: { flex: 1 },
  nickname: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  nicknameLarge: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  bike: { fontSize: 16, color: '#aaa', marginBottom: 10 },
  editBtn: {
    backgroundColor: '#444',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  editText: { color: '#fff', fontWeight: '600' },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 12, color: '#ccc' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  list: { flex: 1 },
  trackCard: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  trackName: { color: '#fff', fontSize: 16, fontWeight: '500' },
  trackMeta: { color: '#aaa', fontSize: 12, marginTop: 4 },
  empty: { color: '#777', fontStyle: 'italic' },
  logoutButton: {
    marginTop: 30,
    backgroundColor: '#BC6C25',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  info: {
    color: '#ddd',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#2c2c2c',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoItem: {
    width: '48%',
    marginBottom: 12,
    backgroundColor: '#3a3a3a',
    padding: 10,
    borderRadius: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#aaa',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  depliantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
