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
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight } from '@/constants/typography';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { useAuthStore } from '@/store/useAuthStore';
import { useRewardStore } from '@/store/useRewardStore';
import { isValidEmail, isValidPassword, isValidName } from '@/utils/validators';

export default function SignupScreen() {
  const signup = useAuthStore((s) => s.signup);
  const hydrateRewards = useRewardStore((s) => s.hydrate);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!isValidName(name)) errs.name = 'Name must be at least 2 characters';
    if (!isValidEmail(email)) errs.email = 'Enter a valid email';
    if (!isValidPassword(password)) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSignup() {
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    const { error } = await signup(email, password, name);
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
          {/* Back button */}
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.form}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join thousands of product testers!</Text>

            {apiError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorBoxText}>{apiError}</Text>
              </View>
            ) : null}

            <Input
              label="Full Name"
              placeholder="John Doe"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              error={errors.name}
            />

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
              onPress={handleSignup}
              label="Create Account"
              variant="secondary"
              size="lg"
              fullWidth
              loading={loading}
              style={{ marginTop: Spacing.md }}
            />

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.loginLink}>Log In</Text>
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
  backButton: {
    padding: Spacing.xl,
    paddingBottom: 0,
  },
  backText: {
    fontSize: FontSize.md,
    color: Colors.blue,
    fontWeight: FontWeight.semibold,
  },
  form: {
    flex: 1,
    padding: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.charcoal,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.gray,
    marginBottom: Spacing.xxxl,
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
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
  },
  loginText: {
    fontSize: FontSize.md,
    color: Colors.darkGray,
  },
  loginLink: {
    fontSize: FontSize.md,
    color: Colors.blue,
    fontWeight: FontWeight.bold,
  },
});
