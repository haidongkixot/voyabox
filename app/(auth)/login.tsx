import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight } from '@/constants/typography';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { useAuthStore } from '@/store/useAuthStore';
import { isValidEmail, isValidPassword } from '@/utils/validators';
import { useRewardStore } from '@/store/useRewardStore';

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const hydrateRewards = useRewardStore((s) => s.hydrate);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!isValidEmail(email)) errs.email = 'Enter a valid email';
    if (!isValidPassword(password)) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    const { error } = await login(email, password);
    if (error) {
      setApiError(error);
      setLoading(false);
      return;
    }
    const userId = useAuthStore.getState().currentUser?.id;
    if (userId) await hydrateRewards(userId);
    router.replace('/(tabs)/home');
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <LinearGradient colors={['#1CB0F6', '#0E8FCC']} style={styles.header}>
            <Text style={styles.logo}>📦</Text>
            <Text style={styles.appName}>Voyabox</Text>
            <Text style={styles.tagline}>Try, Review, Earn</Text>
          </LinearGradient>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.title}>Welcome back!</Text>

            {apiError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{apiError}</Text>
              </View>
            ) : null}

            <Input
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              error={errors.password}
              rightIcon={
                <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <Button
              onPress={handleLogin}
              label="Log In"
              size="lg"
              fullWidth
              loading={loading}
              style={{ marginTop: Spacing.md }}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  scroll: { flexGrow: 1 },
  header: {
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxxl,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logo: { fontSize: 64 },
  appName: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
    marginTop: Spacing.sm,
  },
  tagline: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.85)',
    marginTop: Spacing.xs,
  },
  form: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: Spacing.xxxl,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.charcoal,
    marginBottom: Spacing.xl,
  },
  errorBox: {
    backgroundColor: '#FFF0F0',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.red,
  },
  errorBoxText: {
    color: Colors.red,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.lightGray },
  dividerText: {
    marginHorizontal: Spacing.md,
    color: Colors.gray,
    fontSize: FontSize.sm,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    fontSize: FontSize.md,
    color: Colors.darkGray,
  },
  signupLink: {
    fontSize: FontSize.md,
    color: Colors.blue,
    fontWeight: FontWeight.bold,
  },
});
