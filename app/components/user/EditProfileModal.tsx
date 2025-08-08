import useApi from '@/hooks/useApi';
import { User } from '@/types/user';
import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Props = {
  visible: boolean;
  user: User;
  onClose: () => void;
  onSaved: (updated: User) => void;
};

export default function EditProfileModal({
  visible,
  user,
  onClose,
  onSaved,
}: Props) {
  const { fetchWithAuth } = useApi();

  const [nickname, setNickname] = useState(user.nickname ?? '');
  const [firstName, setFirstName] = useState(user.firstName ?? '');
  const [lastName, setLastName] = useState(user.lastName ?? '');
  const [age, setAge] = useState(user.age ? String(user.age) : '');
  const [gender, setGender] = useState(user.gender ?? '');
  const [bikeBrand, setBikeBrand] = useState(user.bikeBrand ?? '');
  const [bikeModel, setBikeModel] = useState(user.bikeModel ?? '');
  const [bikeType, setBikeType] = useState(user.bikeType ?? '');
  const [ridingStyle, setRidingStyle] = useState(user.ridingStyle ?? '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(
    user.profilePictureUrl ?? ''
  );

  // (Ré)initialiser les champs quand on ouvre la modale
  useEffect(() => {
    if (!visible) return;
    setNickname(user.nickname ?? '');
    setFirstName(user.firstName ?? '');
    setLastName(user.lastName ?? '');
    setAge(user.age ? String(user.age) : '');
    setGender(user.gender ?? '');
    setBikeBrand(user.bikeBrand ?? '');
    setBikeModel(user.bikeModel ?? '');
    setBikeType(user.bikeType ?? '');
    setRidingStyle(user.ridingStyle ?? '');
    setProfilePictureUrl(user.profilePictureUrl ?? '');
  }, [visible, user]);

  const onSave = async () => {
    const payload = {
      nickname: nickname || null,
      firstName: firstName || null,
      lastName: lastName || null,
      age: age ? Number(age) : null,
      gender: gender || null,
      bikeBrand: bikeBrand || null,
      bikeModel: bikeModel || null,
      bikeType: bikeType || null,
      ridingStyle: ridingStyle || null,
      profilePictureUrl: profilePictureUrl || null,
    };

    try {
      const updated = await fetchWithAuth('/users/me', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      onSaved(updated as User);
    } catch (e) {
      console.error('❌ Erreur update profil:', e);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <BlurView intensity={30} tint="dark" style={styles.blurFill} />
        <Pressable
          style={styles.sheet}
          onPress={() => {
            /* stop propagation */
          }}
        >
          <Text style={styles.title}>Modifier le profil</Text>

          <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
            <Section title="Identité">
              <Field label="Nickname">
                <Input
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="Ton pseudo"
                />
              </Field>
              <Row>
                <Field style={{ flex: 1 }} label="Prénom">
                  <Input
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Prénom"
                  />
                </Field>
                <Field style={{ flex: 1 }} label="Nom">
                  <Input
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Nom"
                  />
                </Field>
              </Row>
              <Row>
                <Field style={{ flex: 1 }} label="Âge">
                  <Input
                    value={age}
                    onChangeText={setAge}
                    placeholder="Âge"
                    keyboardType="numeric"
                  />
                </Field>
                <Field style={{ flex: 1 }} label="Genre">
                  <SelectChips
                    value={gender || ''}
                    onChange={setGender}
                    options={[
                      { label: '♂ male', value: 'male' },
                      { label: '♀ female', value: 'female' },
                      { label: 'other', value: 'other' },
                    ]}
                  />
                </Field>
              </Row>
              <Field label="Avatar (URL)">
                <Input
                  value={profilePictureUrl}
                  onChangeText={setProfilePictureUrl}
                  placeholder="https://..."
                  autoCapitalize="none"
                />
              </Field>
            </Section>

            <Section title="Vélo">
              <Row>
                <Field style={{ flex: 1 }} label="Marque">
                  <Input
                    value={bikeBrand}
                    onChangeText={setBikeBrand}
                    placeholder="Commencal..."
                  />
                </Field>
                <Field style={{ flex: 1 }} label="Modèle">
                  <Input
                    value={bikeModel}
                    onChangeText={setBikeModel}
                    placeholder="Meta AM..."
                  />
                </Field>
              </Row>
              <Row>
                <Field style={{ flex: 1 }} label="Type">
                  <SelectChips
                    value={bikeType || ''}
                    onChange={setBikeType}
                    options={[
                      { label: 'trail', value: 'trail' },
                      { label: 'enduro', value: 'enduro' },
                      { label: 'mtb', value: 'mtb' },
                      { label: 'dh', value: 'dh' },
                    ]}
                  />
                </Field>
                <Field style={{ flex: 1 }} label="Style">
                  <SelectChips
                    value={ridingStyle || ''}
                    onChange={setRidingStyle}
                    options={[
                      { label: 'fun', value: 'fun' },
                      { label: 'race', value: 'race' },
                      { label: 'explore', value: 'exploration' },
                    ]}
                  />
                </Field>
              </Row>
            </Section>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnGhost]}
              onPress={onClose}
            >
              <Text style={styles.btnGhostText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={onSave}
            >
              <Text style={styles.btnPrimaryText}>Enregistrer</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* --- UI Bits --- */

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);
const Field = ({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: any;
}) => (
  <View style={[{ marginBottom: 12 }, style]}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);
const Input = (props: React.ComponentProps<typeof TextInput>) => (
  <TextInput placeholderTextColor="#8a8a8a" style={styles.input} {...props} />
);
const Row = ({ children }: { children: React.ReactNode }) => (
  <View style={{ flexDirection: 'row', gap: 12 }}>{children}</View>
);

type SelectOption = { label: string; value: string };
const SelectChips = ({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
}) => {
  return (
    <View style={styles.chipsRow}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => onChange(opt.value)}
          >
            <Text
              style={[styles.chipText, selected && styles.chipTextSelected]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,10,10,0.6)',
    justifyContent: 'flex-end',
  },
  blurFill: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '90%',
  },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 10 },
  sectionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.9,
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
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: '#444',
    backgroundColor: '#222',
  },
  btnGhostText: { color: '#ddd', fontWeight: '600' },
  btnPrimary: {
    backgroundColor: '#BC6C25',
  },
  btnPrimaryText: { color: '#fff', fontWeight: '700' },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#3b3b3b',
    backgroundColor: '#242424',
  },
  chipSelected: {
    backgroundColor: '#BC6C25',
    borderColor: '#BC6C25',
  },
  chipText: {
    color: '#ddd',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
  },
});
