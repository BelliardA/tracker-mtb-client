import { formatDistance } from '@/app/utils/adaptDistance';
import { useAuth } from '@/context/AuthContext';
import useApi from '@/hooks/useApi';
import { User } from '@/types/user';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import SessionByUser from '../components/user/SessionByUser';

export default function Profile() {
  const { authState, onLogout } = useAuth();
  const { fetchWithAuth } = useApi();
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

  useEffect(() => {
    async function load() {
      try {
        await fetchWithAuth('/users/me/stats', { method: 'POST' });
        const profile = await fetchWithAuth('/users/me');
        setUser(profile as User);
      } catch (err) {
        console.error('❌ Erreur de chargement du profil :', err);
      } finally {
        setLoading(false);
      }
    }

    if (authState?.token) {
      load();
    }
  }, [authState?.token]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#888" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Statistiques</Text>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{user.totalRides || 0}</Text>
            <Text style={styles.statLabel}>Rides</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>
              {formatDistance(user.totalDistance)}
            </Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>
              {user.bestTrackTime?.time ?? '--'} s
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
            <Text style={styles.infoValue}>{user.lastName}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Prénom</Text>
            <Text style={styles.infoValue}>{user.firstName}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Âge</Text>
            <Text style={styles.infoValue}>{user.age}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Genre</Text>
            <Text style={styles.infoValue}>{user.gender}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Type</Text>
            <Text style={styles.infoValue}>{user.bikeType}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Style</Text>
            <Text style={styles.infoValue}>{user.ridingStyle}</Text>
          </View>
        </Animated.View>
      </View>
      <SessionByUser userId={user._id} />

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a', padding: 20 },
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
