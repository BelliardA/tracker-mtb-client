import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthState {
  token: string | null;
  authenticated: boolean;
  loading: boolean;
  user?: any; // Ideally replace 'any' with a proper User type
}

export interface RegisterPayload {
  email: string;
  password: string;
  nickname: string;
  bikeBrand: string;
  bikeModel: string;
  bikeType: 'trail' | 'enduro' | 'mtb' | 'dh';
  ridingStyle: 'fun' | 'race' | 'exploration';
  firstName: string;
  lastName: string;
  age: number;
  gender?: 'male' | 'female' | 'other' | null;
  profilePictureUrl?: string | null;
}

interface AuthProps {
  authState?: AuthState;
  onRegister?: (payload: RegisterPayload) => Promise<any>;
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
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    authenticated: false,
    loading: true,
    user: undefined,
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
          user: undefined,
        });
        console.log('🔐 authState mis à jour avec token');
      } else {
        setAuthState({
          token: null,
          authenticated: false,
          loading: false,
          user: undefined,
        });
        console.log('❌ Aucun token trouvé. authState réinitialisé.');
      }
    };
    loadToken();
  }, []);

  const register = async (payload: RegisterPayload) => {
    try {
      return await axios.post(`${API_URL}/auth/signup`, payload);
    } catch (e) {
      const msg = (e as any)?.response?.data?.msg || 'Erreur inscription';
      return { error: true, msg };
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
        user: result.data.user,
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
      user: undefined,
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
