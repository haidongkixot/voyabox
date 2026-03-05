import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Transaction } from '@/types';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight } from '@/constants/typography';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { formatRelativeTime } from '@/utils/formatters';

const TYPE_EMOJI: Record<string, string> = {
  trial_register: '📋',
  review: '✍️',
  photo: '📸',
  first_review_bonus: '🎉',
};

interface RewardHistoryItemProps {
  transaction: Transaction;
}

export function RewardHistoryItem({ transaction }: RewardHistoryItemProps) {
  return (
    <View style={styles.item}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{TYPE_EMOJI[transaction.type] ?? '💎'}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.description}>{transaction.description}</Text>
        <Text style={styles.time}>{formatRelativeTime(transaction.createdAt)}</Text>
      </View>
      <Text style={styles.amount}>+{transaction.amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.tokenBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 20 },
  info: { flex: 1 },
  description: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.charcoal,
  },
  time: {
    fontSize: FontSize.xs,
    color: Colors.gray,
    marginTop: 2,
  },
  amount: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.purpleDark,
  },
});
