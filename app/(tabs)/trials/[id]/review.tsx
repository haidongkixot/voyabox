import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  withDelay,
  useAnimatedStyle,
  FadeInDown,
} from 'react-native-reanimated';
import { Button } from '@/components/common/Button';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight } from '@/constants/typography';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { useAuthStore } from '@/store/useAuthStore';
import { useTrialStore } from '@/store/useTrialStore';
import { useRewardStore } from '@/store/useRewardStore';
import { TOKEN_RULES } from '@/types';

export default function ReviewScreen() {
  const { id: trialId } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.currentUser);
  const getTrialById = useTrialStore((s) => s.getTrialById);
  const submitReview = useTrialStore((s) => s.submitReview);
  const addTokens = useRewardStore((s) => s.addTokens);

  const trial = getTrialById(trialId ?? '');

  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ tokensEarned: number; isFirstReview: boolean } | null>(null);

  // Floating token animations
  const tokenY = useSharedValue(0);
  const tokenOpacity = useSharedValue(0);
  const successScale = useSharedValue(0);

  const tokenStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: tokenY.value }],
    opacity: tokenOpacity.value,
  }));
  const successStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
  }));

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to upload images');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    if (rating === 0) {
      Alert.alert('Rating required', 'Please give a star rating');
      return;
    }
    if (text.trim().length < 20) {
      Alert.alert('Review too short', 'Please write at least 20 characters');
      return;
    }
    if (!user || !trial) return;

    setLoading(true);
    const result = await submitReview(user.id, trial.id, trial.productId, {
      rating,
      text: text.trim(),
      photoUri,
    });

    // Add tokens
    await addTokens(user.id, 'review', TOKEN_RULES.review, 'Wrote a review', result.review.id);
    if (photoUri) {
      await addTokens(user.id, 'photo', TOKEN_RULES.photo, 'Uploaded review photo', result.review.id);
    }
    if (result.isFirstReview) {
      await addTokens(user.id, 'first_review_bonus', TOKEN_RULES.first_review_bonus, 'First review bonus!', result.review.id);
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate
    setSuccess({ tokensEarned: result.tokensEarned, isFirstReview: result.isFirstReview });
    successScale.value = withSequence(withSpring(1.15), withSpring(1));
    tokenY.value = withSequence(withTiming(0), withTiming(-80, { duration: 1000 }));
    tokenOpacity.value = withSequence(
      withTiming(1, { duration: 300 }),
      withDelay(700, withTiming(0, { duration: 300 }))
    );

    setLoading(false);
  }

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <Animated.View style={[styles.successCard, successStyle]}>
            <Text style={styles.successEmoji}>🌟</Text>
            <Text style={styles.successTitle}>Review submitted!</Text>
            <Text style={styles.successSub}>Thank you for sharing your experience</Text>

            <View style={styles.tokensBox}>
              <Text style={styles.tokensLabel}>Tokens Earned</Text>
              <Text style={styles.tokensAmount}>+{success.tokensEarned} 💎</Text>
              {success.isFirstReview && (
                <View style={styles.bonusBadge}>
                  <Text style={styles.bonusText}>🎉 First Review Bonus included!</Text>
                </View>
              )}
            </View>

            <View style={styles.breakdown}>
              <BreakdownRow label="Review" amount={TOKEN_RULES.review} />
              {photoUri && <BreakdownRow label="Photo" amount={TOKEN_RULES.photo} />}
              {success.isFirstReview && <BreakdownRow label="First Review Bonus" amount={TOKEN_RULES.first_review_bonus} highlight />}
            </View>
          </Animated.View>

          {/* Floating token */}
          <Animated.Text style={[styles.floatingToken, tokenStyle]}>+{success.tokensEarned} 💎</Animated.Text>

          <Button
            onPress={() => router.replace('/(tabs)/rewards')}
            label="View Rewards"
            variant="secondary"
            size="lg"
            fullWidth
            style={{ marginTop: Spacing.xl }}
          />
          <Button
            onPress={() => router.replace('/(tabs)/trials')}
            label="Back to Trials"
            variant="ghost"
            size="md"
            fullWidth
            style={{ marginTop: Spacing.sm }}
          />
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
          <Text style={styles.headerTitle}>Share Your Experience</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Product info */}
          {trial && (
            <View style={styles.productBadge}>
              <Text style={styles.productBadgeName}>{trial.product.name}</Text>
              <Text style={styles.productBadgeBrand}>{trial.product.brand.name}</Text>
            </View>
          )}

          {/* Star Rating */}
          <Animated.View style={styles.section} entering={FadeInDown.delay(100)}>
            <Text style={styles.sectionTitle}>How would you rate it?</Text>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => {
                    setRating(star);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[styles.star, star <= rating && styles.starActive]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <Text style={styles.ratingLabel}>
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
              </Text>
            )}
          </Animated.View>

          {/* Text Review */}
          <Animated.View style={styles.section} entering={FadeInDown.delay(200)}>
            <Text style={styles.sectionTitle}>Tell us about your experience</Text>
            <View style={styles.textAreaWrapper}>
              <TextInput
                style={styles.textArea}
                placeholder="Share your honest review... What did you like? What could be better?"
                value={text}
                onChangeText={setText}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                placeholderTextColor={Colors.gray}
              />
              <Text style={styles.charCount}>{text.length} / 500</Text>
            </View>
          </Animated.View>

          {/* Photo Upload */}
          <Animated.View style={styles.section} entering={FadeInDown.delay(300)}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Add a Photo</Text>
              <Text style={styles.tokenHint}>+25 💎</Text>
            </View>
            {photoUri ? (
              <View style={styles.photoPreview}>
                <Image
                  source={{ uri: photoUri }}
                  style={styles.photo}
                  contentFit="cover"
                  transition={300}
                />
                <TouchableOpacity
                  style={styles.removePhoto}
                  onPress={() => setPhotoUri(undefined)}
                >
                  <Text style={styles.removePhotoText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.photoUpload} onPress={pickPhoto}>
                <Text style={styles.photoUploadEmoji}>📷</Text>
                <Text style={styles.photoUploadText}>Upload a photo</Text>
                <Text style={styles.photoUploadSub}>Earn +25 bonus tokens</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* Token preview */}
          <Animated.View style={styles.tokenPreview} entering={FadeInDown.delay(400)}>
            <Text style={styles.tokenPreviewTitle}>💎 Tokens you'll earn</Text>
            <View style={styles.tokenBreakdown}>
              <Text style={styles.tokenItem}>Review: +{TOKEN_RULES.review}</Text>
              {photoUri && <Text style={styles.tokenItem}>Photo: +{TOKEN_RULES.photo}</Text>}
              <Text style={[styles.tokenItem, { color: Colors.orange }]}>
                First review bonus: +{TOKEN_RULES.first_review_bonus} (if eligible)
              </Text>
            </View>
          </Animated.View>

          <Button
            onPress={handleSubmit}
            label="Submit Review"
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

function BreakdownRow({
  label,
  amount,
  highlight,
}: {
  label: string;
  amount: number;
  highlight?: boolean;
}) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={[styles.breakdownLabel, highlight && { color: Colors.orange }]}>{label}</Text>
      <Text style={[styles.breakdownAmount, highlight && { color: Colors.orange }]}>+{amount}</Text>
    </View>
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
  scroll: { paddingBottom: Spacing.xxxl },
  productBadge: {
    margin: Spacing.xl,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.offWhite,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  productBadgeName: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.charcoal,
  },
  productBadgeBrand: { fontSize: FontSize.sm, color: Colors.blue },
  section: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.charcoal,
    marginBottom: Spacing.sm,
  },
  tokenHint: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.purpleDark,
    backgroundColor: Colors.tokenBackground,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  stars: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  star: {
    fontSize: 44,
    color: Colors.lightGray,
  },
  starActive: {
    color: Colors.orange,
  },
  ratingLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.orange,
    marginTop: Spacing.xs,
  },
  textAreaWrapper: {
    backgroundColor: Colors.inputBackground,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 120,
  },
  textArea: {
    fontSize: FontSize.md,
    color: Colors.charcoal,
    minHeight: 100,
  },
  charCount: {
    fontSize: FontSize.xs,
    color: Colors.gray,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  photoPreview: {
    position: 'relative',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.lg,
  },
  removePhoto: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: { color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold },
  photoUpload: {
    borderWidth: 2,
    borderColor: Colors.blue + '50',
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    alignItems: 'center',
    backgroundColor: Colors.blue + '05',
  },
  photoUploadEmoji: { fontSize: 36, marginBottom: Spacing.sm },
  photoUploadText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.blue,
  },
  photoUploadSub: {
    fontSize: FontSize.sm,
    color: Colors.purpleDark,
    marginTop: 4,
  },
  tokenPreview: {
    margin: Spacing.xl,
    backgroundColor: Colors.tokenBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.purple + '30',
  },
  tokenPreviewTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.purpleDark,
    marginBottom: Spacing.sm,
  },
  tokenBreakdown: { gap: 4 },
  tokenItem: {
    fontSize: FontSize.sm,
    color: Colors.charcoal,
  },
  // Success screen
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
    marginBottom: Spacing.xs,
  },
  successSub: {
    fontSize: FontSize.md,
    color: Colors.gray,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  tokensBox: {
    backgroundColor: Colors.tokenBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.purple + '40',
    marginBottom: Spacing.lg,
  },
  tokensLabel: {
    fontSize: FontSize.sm,
    color: Colors.purpleDark,
    fontWeight: FontWeight.semibold,
  },
  tokensAmount: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.purpleDark,
    marginTop: 4,
  },
  bonusBadge: {
    backgroundColor: Colors.orange + '20',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    marginTop: Spacing.sm,
  },
  bonusText: {
    fontSize: FontSize.xs,
    color: Colors.orange,
    fontWeight: FontWeight.bold,
  },
  breakdown: {
    width: '100%',
    gap: Spacing.xs,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  breakdownLabel: { fontSize: FontSize.sm, color: Colors.charcoal },
  breakdownAmount: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.purpleDark,
  },
  floatingToken: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.purpleDark,
  },
});
