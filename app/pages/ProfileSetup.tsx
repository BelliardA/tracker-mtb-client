import { RegisterPayload, useAuth } from '@/context/AuthContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const RequiredHint = () => (
  <Text style={{ color: '#aaa', fontSize: 12, marginBottom: 10 }}>
    * champs obligatoires
  </Text>
);

const Input = (props: React.ComponentProps<typeof TextInput>) => (
  <TextInput placeholderTextColor="#8a8a8a" style={styles.input} {...props} />
);

type SelectOption = { label: string; value: string };

const ChipSelect = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
}) => (
  <View style={styles.chipsRow}>
    {options.map((opt) => {
      const selected = value === opt.value;
      return (
        <TouchableOpacity
          key={opt.value}
          style={[styles.chip, selected && styles.chipSelected]}
          onPress={() => onChange(opt.value)}
        >
          <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

export default function ProfileSetup() {
  const { onRegister, onLogin } = useAuth();
  const { authState } = useAuth();
  const params = useLocalSearchParams<{ email?: string; password?: string }>();
  const email = String(params.email ?? '');
  const password = String(params.password ?? '');
  const router = useRouter();
  const [waitingAuth, setWaitingAuth] = useState(false);

  // Champs requis
  const [nickname, setNickname] = useState('');
  const [bikeBrand, setBikeBrand] = useState('');
  const [bikeModel, setBikeModel] = useState('');
  const [bikeType, setBikeType] = useState<
    'trail' | 'enduro' | 'mtb' | 'dh' | ''
  >('');
  const [ridingStyle, setRidingStyle] = useState<
    'fun' | 'race' | 'exploration' | ''
  >('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>('');

  // Champs optionnels
  const [profilePictureUrl, setProfilePictureUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = useMemo(() => {
    const hasBasics =
      nickname.trim().length > 0 &&
      bikeBrand.trim().length > 0 &&
      bikeModel.trim().length > 0 &&
      !!bikeType &&
      !!ridingStyle;
    const hasIdentity =
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      gender !== '' &&
      Number.isFinite(Number(age)) &&
      Number(age) > 0;

    return hasBasics && hasIdentity;
  }, [
    nickname,
    bikeBrand,
    bikeModel,
    bikeType,
    ridingStyle,
    firstName,
    lastName,
    gender,
    age,
  ]);

  const onSave = async () => {
    if (!isValid || saving) return;
    setSaving(true);
    setError(null);

    if (!onRegister || !onLogin) {
      setError('Auth non initialisé. Réessaie dans un instant.');
      setSaving(false);
      return;
    }

    try {
      const payload: RegisterPayload = {
        email,
        password,
        nickname: nickname.trim(),
        bikeBrand: bikeBrand.trim(),
        bikeModel: bikeModel.trim(),
        bikeType: bikeType as RegisterPayload['bikeType'],
        ridingStyle: ridingStyle as RegisterPayload['ridingStyle'],
        firstName: firstName || 'prenom',
        lastName: lastName || 'nom',
        age: age ? Number(age) : 0,
        gender: gender as RegisterPayload['gender'],
        profilePictureUrl:
          profilePictureUrl || 'https://i.pravatar.cc/150?u=matt',
      };

      const res = await onRegister(payload);

      if ((res as any)?.error) {
        setError((res as any)?.msg || 'Erreur lors de la création du compte');
      } else {
        await onLogin(email, password);
        setWaitingAuth(true);
      }
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (waitingAuth && authState?.authenticated && authState.token) {
      // petite latence pour laisser le contexte finir de se propager
      const t = setTimeout(() => {
        router.replace('/pages/Map');
      }, 300);
      return () => clearTimeout(t);
    }
  }, [waitingAuth, authState?.authenticated, authState?.token]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Complète ton profil</Text>
        <RequiredHint />

        {/* Identité */}
        <Text style={styles.sectionTitle}>Identité</Text>
        <Text style={styles.label}>Surnom *</Text>
        <Input
          value={nickname}
          onChangeText={setNickname}
          placeholder="Ton pseudo"
          autoCapitalize="none"
        />

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Prénom *</Text>
            <Input
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Prénom"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Nom *</Text>
            <Input
              value={lastName}
              onChangeText={setLastName}
              placeholder="Nom"
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Âge *</Text>
            <Input
              value={age}
              onChangeText={setAge}
              placeholder="Âge"
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Genre *</Text>
            <ChipSelect
              value={gender}
              onChange={(v) => setGender(v as any)}
              options={[
                { label: '♂ male', value: 'male' },
                { label: '♀ female', value: 'female' },
                { label: 'other', value: 'other' },
              ]}
            />
          </View>
        </View>

        <Text style={styles.label}>Avatar (URL)</Text>
        <Input
          value={profilePictureUrl}
          onChangeText={setProfilePictureUrl}
          placeholder="https://..."
          autoCapitalize="none"
        />

        {/* Vélo */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Vélo</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Marque *</Text>
            <Input
              value={bikeBrand}
              onChangeText={setBikeBrand}
              placeholder="Commencal..."
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Modèle *</Text>
            <Input
              value={bikeModel}
              onChangeText={setBikeModel}
              placeholder="Meta AM..."
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Type *</Text>
            <ChipSelect
              value={bikeType}
              onChange={(v) => setBikeType(v as any)}
              options={[
                { label: 'trail', value: 'trail' },
                { label: 'enduro', value: 'enduro' },
                { label: 'mtb', value: 'mtb' },
                { label: 'dh', value: 'dh' },
              ]}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Style *</Text>
            <ChipSelect
              value={ridingStyle}
              onChange={(v) => setRidingStyle(v as any)}
              options={[
                { label: 'fun', value: 'fun' },
                { label: 'race', value: 'race' },
                { label: 'explore', value: 'exploration' },
              ]}
            />
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {waitingAuth ? (
          <View
            style={{
              marginTop: 8,
              padding: 12,
              backgroundColor: '#2b2b2b',
              borderRadius: 8,
            }}
          >
            <Text style={{ color: '#ccc' }}>Connexion en cours…</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.btn,
            !isValid || saving ? styles.btnDisabled : styles.btnPrimary,
          ]}
          disabled={!isValid || saving}
          onPress={onSave}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnPrimaryText}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a1a', paddingTop: 60 },
  content: { padding: 16, paddingBottom: 40 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 8,
  },
  label: { color: '#bdbdbd', marginBottom: 6, fontSize: 12 },
  input: {
    backgroundColor: '#2b2b2b',
    borderWidth: 1,
    borderColor: '#3b3b3b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#3b3b3b',
    backgroundColor: '#242424',
  },
  chipSelected: { backgroundColor: '#BC6C25', borderColor: '#BC6C25' },
  chipText: { color: '#ddd', fontSize: 12, fontWeight: '600' },
  chipTextSelected: { color: '#fff' },
  btn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnPrimary: { backgroundColor: '#BC6C25' },
  btnDisabled: { backgroundColor: '#514437' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  error: { color: '#ff6b6b', marginTop: 8 },
});
