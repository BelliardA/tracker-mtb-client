import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthProps {
  authState?: { token: string | null; authenticated: boolean; loading: boolean };
  onRegister?: (email: string, password: string) => Promise<any>;
  onLogin?: (email: string, password: string) => Promise<any>;
  onLogout?: () => Promise<any>;
}

const TOKEN_KEY = 'my-jwt';
export const API_URL = process.env.EXPO_PUBLIC_URL_SERVEUR_API_DEV;
const AuthContext = createContext<AuthProps>({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: any) => {
  const [authState, setAuthState] = useState<{
    token: string | null;
    authenticated: boolean;
    loading: boolean;
  }>({
    token: null,
    authenticated: false,
    loading: true,
  });

  useEffect(() => {
    const loadToken = async () => {
      console.log('🔄 Tentative de chargement du token depuis SecureStore...');
      const token = await SecureStore.getItemAsync(TOKEN_KEY);

      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('✅ Token défini dans Axios');

        setAuthState({
          token,
          authenticated: true,
          loading: false,
        });
        console.log('🔐 authState mis à jour avec token');
      } else {
        setAuthState({
          token: null,
          authenticated: false,
          loading: false,
        });
        console.log('❌ Aucun token trouvé. authState réinitialisé.');
      }
    };
    loadToken();
  }, []);

  const register = async (email: string, password: string) => {
    try {
      return await axios.post(`${API_URL}/auth/signup`, { email, password });
    } catch (e) {
      return { error: true, msg: (e as any).response.data.msg };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      console.log('Login result:', result.data);

      setAuthState({
        token: result.data.token,
        authenticated: true,
        loading: false,
      });

      axios.defaults.headers.common['Authorization'] =
        `Bearer ${result.data.token}`;

      await SecureStore.setItemAsync(TOKEN_KEY, result.data.token);
      console.log('💾 Token stocké avec succès dans SecureStore');

      return result;
    } catch (e) {
      return { error: true, msg: (e as any).response.data.msg };
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);

    axios.defaults.headers.common['Authorization'] = '';

    setAuthState({
      token: null,
      authenticated: false,
      loading: false,
    });
  };

  const value = {
    onRegister: register,
    onLogin: login,
    onLogout: logout,
    authState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
