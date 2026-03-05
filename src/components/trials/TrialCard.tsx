import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Trial } from '@/types';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight } from '@/constants/typography';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { getTrialStatusLabel, formatDate } from '@/utils/formatters';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: Colors.orange + '20', text: Colors.orange },
  approved: { bg: Colors.blue + '20', text: Colors.blue },
  in_progress: { bg: Colors.purple + '20', text: Colors.purpleDark },
  completed: { bg: Colors.green + '20', text: Colors.greenDark },
  rejected: { bg: Colors.red + '20', text: Colors.red },
};

interface TrialCardProps {
  trial: Trial;
}

export function TrialCard({ trial }: TrialCardProps) {
  const statusColor = STATUS_COLORS[trial.status] ?? STATUS_COLORS.pending;
  const canReview = trial.status !== 'rejected' && !trial.hasReview;

  return (
    <View style={styles.card}>
      <View style={styles.imageSection}>
        <Image
          source={{ uri: trial.product.image }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.brand}>{trial.product.brand.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {getTrialStatusLabel(trial.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.productName} numberOfLines={2}>{trial.product.name}</Text>
        <Text style={styles.date}>Registered: {formatDate(trial.registeredAt)}</Text>

        {canReview && (
          <TouchableOpacity
            style={styles.reviewBtn}
            onPress={() => router.push(`/(tabs)/trials/${trial.id}/review`)}
          >
            <Text style={styles.reviewBtnText}>✍️ Write Review • +100 💎</Text>
          </TouchableOpacity>
        )}
        {trial.hasReview && (
          <View style={styles.reviewedBadge}>
            <Text style={styles.reviewedText}>✅ Review submitted</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadow.small,
  },
  imageSection: {
    width: 100,
    height: 120,
  },
  image: { width: '100%', height: '100%' },
  info: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  brand: {
    fontSize: FontSize.xs,
    color: Colors.blue,
    fontWeight: FontWeight.bold,
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  productName: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.charcoal,
    marginBottom: 4,
  },
  date: {
    fontSize: FontSize.xs,
    color: Colors.gray,
    marginBottom: Spacing.xs,
  },
  reviewBtn: {
    backgroundColor: Colors.green,
    borderRadius: BorderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
  },
  reviewBtnText: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  reviewedBadge: {
    backgroundColor: Colors.green + '15',
    borderRadius: BorderRadius.sm,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
  },
  reviewedText: {
    fontSize: FontSize.xs,
    color: Colors.greenDark,
    fontWeight: FontWeight.semibold,
  },
});
