import { colors } from '@/app/styles/colors';
import useApi from '@/hooks/useApi';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function EditProfile() {
  const { authState } = useAuth();
  const router = useRouter();
  const { fetchWithAuth } = useApi();

  const [firstName, setFirstName] = useState(authState?.user?.firstName || '');
  const [lastName, setLastName] = useState(authState?.user?.lastName || '');
  const [nickname, setNickname] = useState(authState?.user?.nickname || '');
  const [age, setAge] = useState(authState?.user?.age?.toString() || '');
  const [bikeBrand, setBikeBrand] = useState(authState?.user?.bikeBrand || '');
  const [bikeModel, setBikeModel] = useState(authState?.user?.bikeModel || '');
  const [gender, setGender] = useState(authState?.user?.gender || '');

  useEffect(() => {
    if (authState?.user) {
      setFirstName(authState.user.firstName || '');
      setLastName(authState.user.lastName || '');
      setNickname(authState.user.nickname || '');
      setAge(authState.user.age?.toString() || '');
      setBikeBrand(authState.user.bikeBrand || '');
      setBikeModel(authState.user.bikeModel || '');
      setGender(authState.user.gender || '');
    }
  }, [authState?.user]);

  const handleSave = async () => {
    try {
      const updatedUser = {
        firstName,
        lastName,
        nickname,
        age: Number(age),
        gender,
        bikeBrand,
        bikeModel,
      };

      const response = await fetchWithAuth('/users/me', {
        method: 'PUT',
        body: JSON.stringify(updatedUser),
      });

      console.log('✅ Profil mis à jour :', response);
      router.push('/pages/Profile');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du profil :', error);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.avatarContainer}>
        <Image
          source={{
            uri: 'https://i.pravatar.cc/100',
          }}
          style={styles.avatar}
        />
      </View>

      <Text style={styles.title}>Modifier le profil</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Prénom</Text>
        <TextInput
          style={styles.input}
          placeholder="Prénom"
          value={firstName}
          onChangeText={setFirstName}
          placeholderTextColor={colors.secondary + '99'}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Nom</Text>
        <TextInput
          style={styles.input}
          placeholder="Nom"
          value={lastName}
          onChangeText={setLastName}
          placeholderTextColor={colors.secondary + '99'}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Pseudo</Text>
        <TextInput
          style={styles.input}
          placeholder="Pseudo"
          value={nickname}
          onChangeText={setNickname}
          placeholderTextColor={colors.secondary + '99'}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Âge</Text>
        <TextInput
          style={styles.input}
          placeholder="Âge"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
          placeholderTextColor={colors.secondary + '99'}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Genre</Text>
        <TextInput
          style={styles.input}
          placeholder="Genre"
          value={gender}
          onChangeText={setGender}
          placeholderTextColor={colors.secondary + '99'}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Marque du vélo</Text>
        <TextInput
          style={styles.input}
          placeholder="Marque"
          value={bikeBrand}
          onChangeText={setBikeBrand}
          placeholderTextColor={colors.secondary + '99'}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Modèle du vélo</Text>
        <TextInput
          style={styles.input}
          placeholder="Modèle"
          value={bikeModel}
          onChangeText={setBikeModel}
          placeholderTextColor={colors.secondary + '99'}
        />
      </View>

      <Pressable onPress={handleSave} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Sauvegarder</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.background,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.secondary,
    color: colors.secondary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
});
