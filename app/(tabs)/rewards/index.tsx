import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ListRenderItem } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { ProgressBar } from '@/components/common/ProgressBar';
import { RewardHistoryItem } from '@/components/rewards/RewardHistoryItem';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight } from '@/constants/typography';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { useRewardStore } from '@/store/useRewardStore';
import { Transaction, XP_PER_LEVEL, getLevelName } from '@/types';
import { formatTokens } from '@/utils/formatters';

export default function RewardsScreen() {
  const { balance, totalEarned, transactions, level, xp } = useRewardStore();
  const xpInCurrentLevel = xp % XP_PER_LEVEL;
  const xpProgress = xpInCurrentLevel / XP_PER_LEVEL;
  const levelName = getLevelName(level);

  const balanceScale = useSharedValue(0.8);
  const balanceOpacity = useSharedValue(0);

  useEffect(() => {
    balanceScale.value = withSpring(1, { damping: 10 });
    balanceOpacity.value = withTiming(1, { duration: 600 });
  }, []);

  const balanceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: balanceScale.value }],
    opacity: balanceOpacity.value,
  }));

  const renderItem: ListRenderItem<Transaction> = ({ item }) => (
    <RewardHistoryItem transaction={item} />
  );

  const Header = (
    <View>
      {/* Balance card */}
      <LinearGradient colors={['#CE82FF', '#9C44FF']} style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Your Token Balance</Text>
        <Animated.Text style={[styles.balance, balanceStyle]}>
          💎 {formatTokens(balance)}
        </Animated.Text>
        <Text style={styles.totalEarned}>Total earned: {totalEarned} tokens</Text>
      </LinearGradient>

      {/* Level card */}
      <View style={styles.levelCard}>
        <View style={styles.levelRow}>
          <View>
            <Text style={styles.levelName}>{levelName}</Text>
            <Text style={styles.levelNumber}>Level {level + 1}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>🏆 {level + 1}</Text>
          </View>
        </View>
        <View style={styles.xpRow}>
          <Text style={styles.xpText}>{xpInCurrentLevel} / {XP_PER_LEVEL} XP</Text>
          <Text style={styles.xpNextLevel}>
            {XP_PER_LEVEL - xpInCurrentLevel} XP to Level {level + 2}
          </Text>
        </View>
        <ProgressBar progress={xpProgress} color={Colors.purple} height={10} />
      </View>

      {/* How to earn */}
      <View style={styles.earnSection}>
        <Text style={styles.earnTitle}>How to Earn Tokens</Text>
        <View style={styles.earnGrid}>
          <EarnItem emoji="📋" label="Register Trial" amount="25" />
          <EarnItem emoji="✍️" label="Write Review" amount="75" />
          <EarnItem emoji="📸" label="Upload Photo" amount="25" />
          <EarnItem emoji="🎉" label="First Review" amount="50" />
        </View>
      </View>

      {/* Transaction history header */}
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Transaction History</Text>
        <Text style={styles.historyCount}>{transactions.length} transactions</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>Rewards</Text>
      </View>
      <FlatList<Transaction>
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={Header}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryText}>No transactions yet.</Text>
            <Text style={styles.emptyHistorySub}>Register for a trial to earn tokens!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function EarnItem({ emoji, label, amount }: { emoji: string; label: string; amount: string }) {
  return (
    <View style={styles.earnItem}>
      <Text style={styles.earnEmoji}>{emoji}</Text>
      <Text style={styles.earnLabel}>{label}</Text>
      <Text style={styles.earnAmount}>+{amount} 💎</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerRow: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  screenTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.charcoal,
  },
  list: { paddingBottom: Spacing.massive },
  balanceCard: {
    margin: Spacing.xl,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxxl,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  balance: {
    fontSize: 52,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  totalEarned: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  levelCard: {
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.purple + '20',
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  levelName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.charcoal,
  },
  levelNumber: {
    fontSize: FontSize.sm,
    color: Colors.gray,
  },
  levelBadge: {
    backgroundColor: Colors.tokenBackground,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.purple + '30',
  },
  levelBadgeText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.purpleDark,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  xpText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.charcoal,
  },
  xpNextLevel: {
    fontSize: FontSize.xs,
    color: Colors.gray,
  },
  earnSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  earnTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.charcoal,
    marginBottom: Spacing.md,
  },
  earnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  earnItem: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  earnEmoji: { fontSize: 28, marginBottom: 4 },
  earnLabel: {
    fontSize: FontSize.xs,
    color: Colors.darkGray,
    textAlign: 'center',
    marginBottom: 2,
  },
  earnAmount: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.extrabold,
    color: Colors.purpleDark,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  historyTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.charcoal,
  },
  historyCount: {
    fontSize: FontSize.sm,
    color: Colors.gray,
  },
  emptyHistory: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.gray,
  },
  emptyHistorySub: {
    fontSize: FontSize.sm,
    color: Colors.gray,
    marginTop: 4,
  },
});
