import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  withSequence,
  withTiming,
  withSpring,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight } from '@/constants/typography';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { useAuthStore } from '@/store/useAuthStore';
import { useTrialStore } from '@/store/useTrialStore';
import { useRewardStore } from '@/store/useRewardStore';
import { useProductStore } from '@/store/useProductStore';
import { isValidPhone, isValidName } from '@/utils/validators';

export default function TrialRegisterScreen() {
  const { id: productId } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.currentUser);
  const registerTrial = useTrialStore((s) => s.registerTrial);
  const addTrialTokens = useRewardStore((s) => s.addTrialRegisterTokens);
  const getProductById = useProductStore((s) => s.getProductById);

  const product = getProductById(productId ?? '');

  const [fullName, setFullName] = useState(user?.name ?? '');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Celebrate animation
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const celebrateStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!isValidName(fullName)) errs.fullName = 'Enter your full name';
    if (!address.trim() || address.trim().length < 10) errs.address = 'Enter your full address';
    if (!isValidPhone(phone)) errs.phone = 'Enter a valid phone number';
    if (!preferredDate.trim()) errs.preferredDate = 'Select a preferred date';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate() || !user || !product) return;
    setLoading(true);

    const trial = await registerTrial(user.id, product.id, {
      fullName,
      address,
      phone,
      preferredDate,
    });
    await addTrialTokens(user.id, trial.id);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Show celebration
    setSuccess(true);
    scale.value = withSequence(withSpring(1.2), withSpring(1));
    opacity.value = withTiming(1, { duration: 300 });

    setLoading(false);
  }

  function handleDone() {
    router.replace('/(tabs)/trials');
  }

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Animated.View style={[styles.successCard, celebrateStyle]}>
            <Text style={styles.successEmoji}>🎉</Text>
            <Text style={styles.successTitle}>You're registered!</Text>
            <Text style={styles.successSubtitle}>
              Trial for <Text style={{ fontWeight: FontWeight.bold }}>{product?.name}</Text> has been submitted.
            </Text>
            <View style={styles.tokenEarned}>
              <Text style={styles.tokenEarnedText}>+25 💎 tokens earned!</Text>
            </View>
            <Text style={styles.successNote}>
              We'll review your application and notify you within 3-5 business days.
            </Text>
          </Animated.View>
          <Button onPress={handleDone} label="View My Trials" size="lg" fullWidth style={{ marginTop: Spacing.xl }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Register for Trial</Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>{product?.name}</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Product info */}
          <View style={styles.productInfo}>
            <Text style={styles.productInfoLabel}>🏷️ {product?.brand.name}</Text>
            <Text style={styles.productInfoName}>{product?.name}</Text>
            <View style={styles.tokenPreview}>
              <Text style={styles.tokenPreviewText}>💎 Earn 25 tokens for registering</Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>Your Information</Text>

            <Input
              label="Full Name"
              placeholder="John Doe"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              error={errors.fullName}
            />

            <Input
              label="Delivery Address"
              placeholder="123 Main St, City, Country"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
              error={errors.address}
            />

            <Input
              label="Phone Number"
              placeholder="+1 234 567 8900"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              error={errors.phone}
            />

            <Input
              label="Preferred Start Date (MM/DD/YYYY)"
              placeholder="03/20/2026"
              value={preferredDate}
              onChangeText={setPreferredDate}
              error={errors.preferredDate}
            />
          </View>

          <Button
            onPress={handleSubmit}
            label="Submit Registration"
            variant="secondary"
            size="lg"
            fullWidth
            loading={loading}
            style={{ marginHorizontal: Spacing.xl, marginBottom: Spacing.xl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    gap: Spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: { fontSize: 20, color: Colors.charcoal },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.charcoal,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.gray,
  },
  scroll: { paddingBottom: Spacing.xxxl },
  productInfo: {
    margin: Spacing.xl,
    backgroundColor: Colors.blue + '10',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.blue + '30',
  },
  productInfoLabel: {
    fontSize: FontSize.sm,
    color: Colors.blue,
    fontWeight: FontWeight.semibold,
  },
  productInfoName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.charcoal,
    marginTop: 4,
    marginBottom: Spacing.sm,
  },
  tokenPreview: {
    backgroundColor: Colors.tokenBackground,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.purple + '30',
  },
  tokenPreviewText: {
    fontSize: FontSize.sm,
    color: Colors.purpleDark,
    fontWeight: FontWeight.semibold,
  },
  form: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  formTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.charcoal,
    marginBottom: Spacing.lg,
  },
  successContainer: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  successCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxxl,
    alignItems: 'center',
    ...Shadow.large,
    borderWidth: 1,
    borderColor: Colors.green + '30',
  },
  successEmoji: { fontSize: 72, marginBottom: Spacing.lg },
  successTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.charcoal,
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    fontSize: FontSize.md,
    color: Colors.darkGray,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  tokenEarned: {
    backgroundColor: Colors.tokenBackground,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.purple + '40',
  },
  tokenEarnedText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.purpleDark,
  },
  successNote: {
    fontSize: FontSize.sm,
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
});
