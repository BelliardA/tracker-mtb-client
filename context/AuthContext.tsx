import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface AuthState {
  token: string | null;
  authenticated: boolean;
  loading: boolean;
  user?: any; // TODO: remplace 'any' par ton vrai type User
  userId?: string | null;
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

interface AuthContextType {
  authState: AuthState;
  onRegister: (payload: RegisterPayload) => Promise<any>;
  onLogin: (email: string, password: string) => Promise<any>;
  onLogout: () => Promise<void>;
  refreshAuthFromStorage: () => Promise<void>;
}

const TOKEN_KEY = 'my-jwt';
const USER_ID_KEY = 'user-id';
const USER_OBJ_KEY = 'user-obj';

export const API_URL = process.env.EXPO_PUBLIC_URL_SERVEUR_API_DEV;
const AuthContext = createContext<AuthContextType>({} as any);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    authenticated: false,
    loading: true,
    user: undefined,
    userId: null,
  });

  const applyToken = useCallback(
    async (token: string, user?: any, userId?: string) => {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('✅ Token défini dans Axios');

      setAuthState({
        token,
        authenticated: true,
        loading: false,
        user: user ?? undefined,
        userId: userId ?? user?._id ?? null,
      });
      console.log('🔐 authState mis à jour avec token');

      // Persistance (non bloquant pour l’UI)
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      if (userId ?? user?._id) {
        await SecureStore.setItemAsync(USER_ID_KEY, userId ?? user?._id);
      }
      if (user) {
        await SecureStore.setItemAsync(USER_OBJ_KEY, JSON.stringify(user));
      }
      console.log('💾 Auth sauvegardée dans SecureStore');
    },
    []
  );

  const refreshAuthFromStorage = useCallback(async () => {
    try {
      console.log('🔄 Tentative de chargement du token depuis SecureStore...');
      const [token, storedUserId, storedUserStr] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_ID_KEY),
        SecureStore.getItemAsync(USER_OBJ_KEY),
      ]);

      if (token) {
        let storedUser: any | undefined = undefined;
        if (storedUserStr) {
          try {
            storedUser = JSON.parse(storedUserStr);
          } catch {
            storedUser = undefined;
          }
        }
        await applyToken(token, storedUser, storedUserId ?? undefined);
      } else {
        console.log('❌ Aucun token trouvé. authState réinitialisé.');
        setAuthState({
          token: null,
          authenticated: false,
          loading: false,
          user: undefined,
          userId: null,
        });
      }
    } catch (e) {
      console.error('❌ Erreur de lecture SecureStore', e);
      setAuthState({
        token: null,
        authenticated: false,
        loading: false,
        user: undefined,
        userId: null,
      });
    }
  }, [applyToken]);

  useEffect(() => {
    refreshAuthFromStorage();
  }, [refreshAuthFromStorage]);

  const onRegister = useCallback(async (payload: RegisterPayload) => {
    try {
      const res = await axios.post(`${API_URL}/auth/signup`, payload);
      return res.data;
    } catch (e: any) {
      const msg = e?.response?.data?.msg || 'Erreur inscription';
      return { error: true, msg };
    }
  }, []);

  const onLogin = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await axios.post(`${API_URL}/auth/login`, {
          email,
          password,
        });
        console.log('Login result:', result.data); // { token, userId?, user? }

        const token = result.data?.token;
        const userId = result.data?.userId ?? result.data?.user?._id;
        const user = result.data?.user;

        if (!token) {
          throw new Error('Token manquant dans la réponse login');
        }

        await applyToken(token, user, userId);
        return result;
      } catch (e: any) {
        const msg = e?.response?.data?.msg || 'Erreur de connexion';
        return { error: true, msg };
      }
    },
    [applyToken]
  );

  const onLogout = useCallback(async () => {
    try {
      delete axios.defaults.headers.common['Authorization'];
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(USER_ID_KEY),
        SecureStore.deleteItemAsync(USER_OBJ_KEY),
      ]);
    } finally {
      setAuthState({
        token: null,
        authenticated: false,
        loading: false,
        user: undefined,
        userId: null,
      });
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      authState,
      onRegister,
      onLogin,
      onLogout,
      refreshAuthFromStorage,
    }),
    [authState, onRegister, onLogin, onLogout, refreshAuthFromStorage]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
