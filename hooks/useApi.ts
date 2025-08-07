import { useAuth } from '../context/AuthContext';

export default function useApi() {
  const { authState, onLogout = () => {} } = useAuth();
  const baseUrl = process.env.EXPO_PUBLIC_URL_SERVEUR_API_DEV;

  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${authState?.token}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        console.warn('🔒 Token invalide ou expiré, déconnexion en cours...');
        onLogout();
      }

      return response.ok
        ? await response.json()
        : Promise.reject(
            new Error(`Erreur ${response.status}: ${response.statusText}`)
          );
    } catch (error) {
      console.error('❌ Erreur lors du fetch :', error);
      throw error;
    }
  };

  return { fetchWithAuth };
}
