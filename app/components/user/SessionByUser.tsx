import { formatDistance } from '@/app/utils/adaptDistance';
import useApi from '@/hooks/useApi';
import { Session } from '@/types/session';
import { router } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SessionByUser({
  userId,
  canDelete = false,
  onSelectSession,
}: {
  userId: string;
  canDelete?: boolean;
  onSelectSession?: (sessionId: string) => void;
}) {
  const { fetchWithAuth } = useApi();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingSessionIds, setDeletingSessionIds] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!userId) {
        console.warn('⚠️ Aucun userId fourni à SessionByUser.');
        setLoading(false);
        return;
      }
      try {
        const data: Session[] = await fetchWithAuth(`/session/user/${userId}`);
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

  const handleDelete = (sessionId: string) => {
    Alert.alert(
      'Supprimer la session',
      'Es-tu sûr de vouloir supprimer cette piste ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetchWithAuth(`/session/${sessionId}`, {
                method: 'DELETE',
              });
              setDeletingSessionIds((prev) => [...prev, sessionId]);
              setSessions((prev) => prev.filter((s) => s._id !== sessionId));
            } catch (error) {
              console.error('❌ Erreur suppression session:', error);
            }
          },
        },
      ]
    );
  };

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
      {sessions.map((session) => {
        const id = String(session._id);
        const isDeleting = deletingSessionIds.includes(id);
        if (isDeleting) return null;

        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityLabel={`Ouvrir la piste ${session.name}`}
            onPress={() => {
              if (onSelectSession) {
                onSelectSession(id);
              } else {
                // Fallback: ouvre la map et affiche TrackDetails sur cette piste
                router.push({
                  pathname: '/pages/Map',
                  params: { focusTrackId: id, openDetails: '1' },
                });
              }
            }}
            android_ripple={{ color: '#222', borderless: false }}
            style={({ pressed }) => [
              styles.sessionCard,
              pressed && { transform: [{ scale: 0.995 }], opacity: 0.95 },
            ]}
          >
            <Text style={styles.sessionName}>{session.name}</Text>
            <Text style={styles.sessionMeta}>
              {new Date(session.startTime).toLocaleString()} -{' '}
              {formatDistance(session.totalDistance)}
            </Text>

            {canDelete && session.userId === userId && (
              <TouchableOpacity
                onPress={() => handleDelete(id)}
                style={styles.trashIcon}
                accessibilityLabel="Supprimer cette piste"
              >
                <Trash2 color="#BC6C25" size={20} />
              </TouchableOpacity>
            )}
          </Pressable>
        );
      })}
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
  deleteButton: {
    marginTop: 8,
    backgroundColor: '#BC6C25',
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  deleteText: {
    color: '#fff',
    fontWeight: '600',
  },
  trashIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
});
