import { AuthProvider } from '@/context/AuthContext';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false, // ⬅️ masque la barre blanche partout
          contentStyle: { backgroundColor: '#000' }, // optionnel: fond
        }}
      />
    </AuthProvider>
  );
}
