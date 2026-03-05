import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight } from '@/constants/typography';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { useProductStore } from '@/store/useProductStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useTrialStore } from '@/store/useTrialStore';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const getProductById = useProductStore((s) => s.getProductById);
  const user = useAuthStore((s) => s.currentUser);
  const hasRegistered = useTrialStore((s) => s.hasUserRegisteredProduct);

  const product = getProductById(productId ?? '');

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Product not found</Text>
      </SafeAreaView>
    );
  }

  const alreadyRegistered = user ? hasRegistered(user.id, product.id) : false;
  const spotsPercent = product.spotsRemaining / product.spotsTotal;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image header */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.image }}
            style={styles.image}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent']}
            style={styles.topGradient}
          />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          {product.featured && (
            <LinearGradient colors={['#FF9600', '#FF6B00']} style={styles.featuredBadge}>
              <Text style={styles.featuredText}>⭐ Featured Trial</Text>
            </LinearGradient>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Brand + Name */}
          <Text style={styles.brand}>{product.brand.name}</Text>
          <Text style={styles.name}>{product.name}</Text>

          {/* Tags */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
            <View style={styles.tags}>
              {product.tags.map((tag) => (
                <Badge key={tag} label={tag} color={Colors.blue + '15'} textColor={Colors.blue} />
              ))}
            </View>
          </ScrollView>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatBox emoji="⭐" value={product.rating.toString()} label="Rating" />
            <StatBox emoji="💬" value={product.reviewCount.toString()} label="Reviews" />
            <StatBox emoji="📅" value={`${product.trialDuration}d`} label="Duration" />
            <StatBox emoji="👥" value={product.spotsRemaining.toString()} label="Spots Left" />
          </View>

          {/* Spots progress */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>Availability</Text>
              <Text style={[styles.spotsText, spotsPercent < 0.2 && styles.spotsUrgent]}>
                {product.spotsRemaining} / {product.spotsTotal} spots
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${spotsPercent * 100}%`,
                    backgroundColor: spotsPercent < 0.2 ? Colors.red : Colors.green,
                  },
                ]}
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>About this product</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          {/* Token rewards */}
          <View style={[styles.section, styles.rewardBox]}>
            <Text style={styles.rewardTitle}>💎 Tokens you'll earn</Text>
            <View style={styles.rewardItems}>
              <RewardItem label="Register for trial" amount="+25" />
              <RewardItem label="Write a review" amount="+75" />
              <RewardItem label="Upload photo" amount="+25" />
              <RewardItem label="First review bonus" amount="+50" />
            </View>
          </View>

          {/* Spacer for CTA */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.cta}>
        {alreadyRegistered ? (
          <View style={styles.registeredBox}>
            <Text style={styles.registeredEmoji}>✅</Text>
            <Text style={styles.registeredText}>Already registered for this trial</Text>
          </View>
        ) : product.spotsRemaining === 0 ? (
          <Button onPress={() => {}} label="No Spots Available" disabled fullWidth size="lg" />
        ) : (
          <Button
            onPress={() => router.push(`/(tabs)/trials/${product.id}/register`)}
            label="Register for Trial"
            variant="secondary"
            size="lg"
            fullWidth
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function StatBox({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function RewardItem({ label, amount }: { label: string; amount: string }) {
  return (
    <View style={styles.rewardItem}>
      <Text style={styles.rewardLabel}>{label}</Text>
      <Text style={styles.rewardAmount}>{amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  imageContainer: {
    height: 280,
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  topGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0, height: 100,
  },
  backBtn: {
    position: 'absolute',
    top: Spacing.xl,
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.small,
  },
  backBtnText: { fontSize: 20, color: Colors.charcoal },
  featuredBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  featuredText: {
    fontSize: FontSize.sm,
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  content: { padding: Spacing.xl },
  brand: {
    fontSize: FontSize.sm,
    color: Colors.blue,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  name: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.charcoal,
    marginBottom: Spacing.md,
  },
  tags: { flexDirection: 'row', gap: Spacing.xs },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.offWhite,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginHorizontal: 3,
  },
  statEmoji: { fontSize: 18, marginBottom: 2 },
  statValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    color: Colors.charcoal,
  },
  statLabel: { fontSize: FontSize.xs, color: Colors.gray },
  section: { marginBottom: Spacing.xl },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.charcoal,
    marginBottom: Spacing.sm,
  },
  spotsText: {
    fontSize: FontSize.sm,
    color: Colors.green,
    fontWeight: FontWeight.semibold,
  },
  spotsUrgent: { color: Colors.red },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  description: {
    fontSize: FontSize.md,
    color: Colors.darkGray,
    lineHeight: 24,
  },
  rewardBox: {
    backgroundColor: Colors.tokenBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.purple + '30',
  },
  rewardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.purpleDark,
    marginBottom: Spacing.md,
  },
  rewardItems: { gap: Spacing.sm },
  rewardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardLabel: { fontSize: FontSize.sm, color: Colors.charcoal },
  rewardAmount: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
    color: Colors.purpleDark,
  },
  cta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    ...Shadow.medium,
  },
  registeredBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.green + '15',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  registeredEmoji: { fontSize: 24 },
  registeredText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.greenDark,
  },
});
