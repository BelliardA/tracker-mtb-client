import { formatDistance } from '@/app/utils/adaptDistance';
import useApi from '@/hooks/useApi';
import { Session } from '@/types/session';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SessionByUser({ userId }: { userId: string }) {
  const { fetchWithAuth } = useApi();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!userId) {
        console.warn('⚠️ Aucun userId fourni à SessionByUser.');
        return;
      }
      try {
        const data = await fetchWithAuth(`/session/user/${userId}`);
        setSessions(
          data.sort(
            (a: any, b: any) =>
              new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
          )
        );
      } catch (err) {
        console.error('❌ Erreur chargement des sessions:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  if (loading)
    return <Text style={styles.loading}>Chargement des pistes...</Text>;
  if (!sessions.length)
    return (
      <View style={styles.noData}>
        <Text style={styles.empty}>Aucune piste enregistrée.</Text>
        <TouchableOpacity onPress={() => router.push('/pages/DataSender')}>
          <Text style={styles.cta}>Commencer une nouvelle descente</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dernières pistes</Text>
      {sessions.map((session) => (
        <View key={session._id} style={styles.sessionCard}>
          <Text style={styles.sessionName}>{session.name}</Text>
          <Text style={styles.sessionMeta}>
            {new Date(session.startTime).toLocaleString()} -{' '}
            {formatDistance(session.totalDistance)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#2c2c2c',
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  sessionCard: {
    backgroundColor: '#3a3a3a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  sessionName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  sessionMeta: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  loading: {
    color: '#ccc',
    fontStyle: 'italic',
    padding: 10,
  },
  empty: {
    color: '#999',
    padding: 10,
    fontStyle: 'italic',
  },
  noData: {
    alignItems: 'center',
    padding: 10,
  },
  cta: {
    marginTop: 8,
    color: '#DDA15E',
    fontWeight: '600',
  },
});
