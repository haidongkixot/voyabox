import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '@/components/common/Avatar';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Button } from '@/components/common/Button';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight } from '@/constants/typography';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';
import { useAuthStore } from '@/store/useAuthStore';
import { useRewardStore } from '@/store/useRewardStore';
import { useTrialStore } from '@/store/useTrialStore';
import { getLevelName, XP_PER_LEVEL } from '@/types';
import { formatDate, formatTokens } from '@/utils/formatters';

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const { balance, level, xp, transactions } = useRewardStore();
  const getTrialsByUser = useTrialStore((s) => s.getTrialsByUser);

  if (!user) return null;

  const trials = getTrialsByUser(user.id);
  const completedTrials = trials.filter((t) => t.hasReview).length;
  const levelName = getLevelName(level);
  const xpInLevel = xp % XP_PER_LEVEL;
  const xpProgress = xpInLevel / XP_PER_LEVEL;

  function handleLogout() {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <LinearGradient colors={['#1CB0F6', '#0E8FCC']} style={styles.header}>
          <Avatar name={user.name} size={80} />
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.joinDate}>Member since {formatDate(user.createdAt)}</Text>
        </LinearGradient>

        {/* Level card */}
        <View style={styles.levelCard}>
          <View style={styles.levelRow}>
            <View>
              <Text style={styles.levelTitle}>{levelName}</Text>
              <Text style={styles.levelSub}>Level {level + 1}</Text>
            </View>
            <View style={styles.balancePill}>
              <Text style={styles.balanceText}>💎 {formatTokens(balance)}</Text>
            </View>
          </View>
          <View style={styles.xpRow}>
            <Text style={styles.xpLabel}>{xpInLevel} / {XP_PER_LEVEL} XP</Text>
            <Text style={styles.xpNextLabel}>{XP_PER_LEVEL - xpInLevel} to next level</Text>
          </View>
          <ProgressBar progress={xpProgress} color={Colors.blue} height={10} />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard emoji="📋" value={trials.length.toString()} label="Trials" />
          <StatCard emoji="✅" value={completedTrials.toString()} label="Reviewed" />
          <StatCard emoji="💎" value={formatTokens(balance)} label="Tokens" />
          <StatCard emoji="🎯" value={transactions.length.toString()} label="Actions" />
        </View>

        {/* Menu items */}
        <View style={styles.menu}>
          <MenuSection title="Activity">
            <MenuItem
              emoji="📋"
              label="My Trials"
              value={`${trials.length} total`}
              onPress={() => router.push('/(tabs)/trials')}
            />
            <MenuItem
              emoji="💎"
              label="Rewards"
              value={`${formatTokens(balance)} tokens`}
              onPress={() => router.push('/(tabs)/rewards')}
            />
          </MenuSection>

          <MenuSection title="Account">
            <MenuItem emoji="📧" label="Email" value={user.email} />
            <MenuItem
              emoji="🔒"
              label="Change Password"
              onPress={() => Alert.alert('Coming Soon', 'This feature is in development')}
            />
            <MenuItem
              emoji="🔔"
              label="Notifications"
              onPress={() => Alert.alert('Coming Soon', 'This feature is in development')}
            />
          </MenuSection>

          <MenuSection title="Support">
            <MenuItem
              emoji="❓"
              label="Help & FAQ"
              onPress={() => Alert.alert('Help', 'For support, contact support@voyabox.com')}
            />
            <MenuItem
              emoji="⭐"
              label="Rate the App"
              onPress={() => Alert.alert('Thank you!', 'We appreciate your feedback')}
            />
          </MenuSection>
        </View>

        {/* Logout */}
        <Button
          onPress={handleLogout}
          label="Log Out"
          variant="danger"
          size="lg"
          fullWidth
          style={{ margin: Spacing.xl }}
        />

        <Text style={styles.version}>Voyabox v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ emoji, value, label }: { emoji: string; value: string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.menuSection}>
      <Text style={styles.menuSectionTitle}>{title}</Text>
      <View style={styles.menuGroup}>{children}</View>
    </View>
  );
}

function MenuItem({
  emoji,
  label,
  value,
  onPress,
}: {
  emoji: string;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.menuItemEmoji}>{emoji}</Text>
      <Text style={styles.menuItemLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      {value && <Text style={styles.menuItemValue} numberOfLines={1}>{value}</Text>}
      {onPress && <Text style={styles.menuItemChevron}>›</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.offWhite },
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  name: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
    marginTop: Spacing.sm,
  },
  email: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  joinDate: {
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.6)',
  },
  levelCard: {
    backgroundColor: Colors.white,
    margin: Spacing.xl,
    marginTop: -Spacing.xl,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadow.medium,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  levelTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.charcoal,
  },
  levelSub: { fontSize: FontSize.sm, color: Colors.gray },
  balancePill: {
    backgroundColor: Colors.tokenBackground,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.purple + '30',
  },
  balanceText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    color: Colors.purpleDark,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  xpLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.charcoal },
  xpNextLabel: { fontSize: FontSize.xs, color: Colors.gray },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    ...Shadow.small,
  },
  statEmoji: { fontSize: 22, marginBottom: 2 },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.charcoal,
  },
  statLabel: { fontSize: FontSize.xs, color: Colors.gray },
  menu: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  menuSection: {},
  menuSectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.gray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
    paddingLeft: Spacing.xs,
  },
  menuGroup: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadow.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.offWhite,
    gap: Spacing.md,
  },
  menuItemEmoji: { fontSize: 20, width: 26 },
  menuItemLabel: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.charcoal,
  },
  menuItemValue: {
    fontSize: FontSize.sm,
    color: Colors.gray,
    maxWidth: 120,
  },
  menuItemChevron: {
    fontSize: 20,
    color: Colors.gray,
    marginLeft: Spacing.xs,
  },
  version: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    color: Colors.gray,
    marginBottom: Spacing.massive,
  },
});
