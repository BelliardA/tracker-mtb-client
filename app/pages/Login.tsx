import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import useApi from '../../hooks/useApi';

// Theme
const COLORS = {
  bg: '#FEFAE0', // background from theme
  text: '#283618', // secondary from theme
  sub: '#606C38', // primary from theme
  primary: '#606C38', // primary
  danger: '#BC6C25', // warning from theme
  success: '#DDA15E', // accent from theme
  border: '#DDA15E', // accent for borders
  card: '#fff', // white card background
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PWD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\p{P}\p{S}]).{12,}$/u;

type Step = 'email' | 'password';

type Mode = 'login' | 'register' | null;

const Login: React.FC = () => {
  const router = useRouter();
  const { onLogin, onRegister, authState } = useAuth();
  const api = useApi();

  const [step, setStep] = useState<Step>('email');
  const [mode, setMode] = useState<Mode>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animations
  const emailY = useRef(new Animated.Value(0)).current; // move up when showing password
  const pwOpacity = useRef(new Animated.Value(0)).current;

  const emailValid = useMemo(() => EMAIL_REGEX.test(email.trim()), [email]);
  const pwdChecks = useMemo(
    () => ({
      length: password.length >= 12,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      digit: /\d/.test(password),
      punct: /[\p{P}\p{S}]/u.test(password),
    }),
    [password]
  );
  const pwdValid = useMemo(
    () => Object.values(pwdChecks).every(Boolean),
    [pwdChecks]
  );

  useEffect(() => {
    if (!authState.loading && authState.authenticated) {
      const id = setTimeout(() => {
        try {
          router.replace('/');
        } catch {}
      }, 0);
      return () => clearTimeout(id);
    }
  }, [authState.loading, authState.authenticated, router]);

  const handleContinue = async () => {
    setError(null);
    if (!emailValid) {
      setError('Veuillez saisir un email valide.');
      return;
    }
    setLoading(true);
    try {
      const resp = await api.fetchWithAuth('/auth/check-email', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      const exists = !!(resp?.exists as boolean);
      setMode(exists ? 'login' : 'register');
      setStep('password');
      Animated.parallel([
        Animated.timing(emailY, {
          toValue: -20,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(pwOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } catch (e: any) {
      setError(e?.message || 'Impossible de vérifier cet email.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    setError(null);
    if (!mode) return;
    if (mode === 'login') {
      setLoading(true);
      try {
        const result = await onLogin?.(email.trim(), password);
        if (result && (result as any).error) {
          setError((result as any).msg || 'Identifiants invalides.');
        }
      } catch (e: any) {
        setError(e?.message || 'Connexion impossible.');
      } finally {
        setLoading(false);
      }
    } else {
      // register → on ne crée pas le compte ici.
      // On redirige vers ProfileSetup qui effectuera l'inscription
      if (!pwdValid) {
        setError('Le mot de passe ne respecte pas les critères.');
        return;
      }
      try {
        // On arrête un éventuel spinner
        setLoading(false);
        router.push({
          pathname: '/pages/ProfileSetup',
          params: { email: email.trim(), password },
        });
      } catch (e: any) {
        setError(e?.message || 'Navigation impossible.');
      }
    }
  };

  const resetEmail = () => {
    setMode(null);
    setPassword('');
    setStep('email');
    Animated.parallel([
      Animated.timing(emailY, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(pwOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const ActionButtonLabel = mode === 'login' ? 'Se connecter' : 'Continuer';

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={styles.container}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Bienvenue</Text>
        <Text style={styles.subtitle}>Entrez votre email pour continuer</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Animated.View
          style={[styles.fieldRow, { transform: [{ translateY: emailY }] }]}
        >
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[
              styles.input,
              !email
                ? undefined
                : emailValid
                  ? styles.inputOk
                  : styles.inputErr,
            ]}
            placeholder="votre@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={step === 'email'}
          />
        </Animated.View>

        {step === 'email' ? (
          <Pressable
            onPress={handleContinue}
            disabled={!emailValid || loading}
            style={({ pressed }) => [
              styles.primaryBtn,
              (!emailValid || loading) && styles.btnDisabled,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? 'Vérification…' : 'Continuer'}
            </Text>
          </Pressable>
        ) : null}

        {/* Password step */}
        {step === 'password' && (
          <Animated.View style={{ opacity: pwOpacity }}>
            <View style={{ height: 12 }} />
            <Text style={styles.label}>
              {mode === 'login' ? 'Mot de passe' : 'Créer un mot de passe'}
            </Text>
            <TextInput
              style={[styles.input]}
              placeholder={
                mode === 'login'
                  ? 'Votre mot de passe'
                  : '12+ caractères, majuscule, chiffre, ponctuation'
              }
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />

            {mode === 'register' && (
              <View style={styles.checklist}>
                <Rule ok={pwdChecks.length} label="12 caractères ou plus" />
                <Rule ok={pwdChecks.upper} label="1 majuscule" />
                <Rule ok={pwdChecks.lower} label="1 minuscule" />
                <Rule ok={pwdChecks.digit} label="1 chiffre" />
                <Rule ok={pwdChecks.punct} label="1 signe de ponctuation" />
              </View>
            )}

            <Pressable
              onPress={handleAuth}
              disabled={
                (mode === 'login' ? password.length === 0 : !pwdValid) ||
                loading
              }
              style={({ pressed }) => [
                styles.primaryBtn,
                ((mode === 'login' ? password.length === 0 : !pwdValid) ||
                  loading) &&
                  styles.btnDisabled,
                pressed && styles.btnPressed,
              ]}
            >
              <Text style={styles.primaryBtnText}>
                {loading
                  ? mode === 'login'
                    ? 'Connexion…'
                    : 'Création…'
                  : ActionButtonLabel}
              </Text>
            </Pressable>

            <Pressable
              onPress={resetEmail}
              style={styles.linkBtn}
              accessibilityRole="button"
            >
              <Text style={styles.linkText}>Changer d’email</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const Rule: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
  <View style={styles.ruleRow}>
    <View
      style={[
        styles.bullet,
        { backgroundColor: ok ? COLORS.success : COLORS.border },
      ]}
    />
    <Text style={[styles.ruleText, { color: ok ? COLORS.text : COLORS.sub }]}>
      {label}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.sub,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  error: { color: COLORS.danger, textAlign: 'center', marginBottom: 8 },
  fieldRow: { marginBottom: 12 },
  label: { fontSize: 12, color: COLORS.sub, marginBottom: 6 },
  input: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  inputOk: { borderColor: COLORS.success },
  inputErr: { borderColor: COLORS.danger },
  primaryBtn: {
    marginTop: 12,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
  btnPressed: { opacity: 0.9 },
  checklist: { marginTop: 10 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  bullet: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  ruleText: { fontSize: 12 },
  linkBtn: { marginTop: 12, alignSelf: 'center' },
  linkText: { color: COLORS.text, textDecorationLine: 'underline' },
});

export default Login;
