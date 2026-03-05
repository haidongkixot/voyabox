import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrialCard } from '@/components/trials/TrialCard';
import { Button } from '@/components/common/Button';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useAuthStore } from '@/store/useAuthStore';
import { useTrialStore } from '@/store/useTrialStore';
import { Trial } from '@/types';
import { router } from 'expo-router';

export default function TrialsScreen() {
  const user = useAuthStore((s) => s.currentUser);
  const getTrialsByUser = useTrialStore((s) => s.getTrialsByUser);

  const trials = user ? getTrialsByUser(user.id) : [];
  const pendingReviews = trials.filter((t) => !t.hasReview && t.status !== 'rejected');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Trials</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{trials.length}</Text>
        </View>
      </View>

      {/* Pending reviews callout */}
      {pendingReviews.length > 0 && (
        <View style={styles.callout}>
          <Text style={styles.calloutEmoji}>✍️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.calloutTitle}>
              {pendingReviews.length} trial{pendingReviews.length > 1 ? 's' : ''} awaiting review
            </Text>
            <Text style={styles.calloutSub}>Write reviews to earn tokens!</Text>
          </View>
          <Text style={styles.calloutTokens}>+{pendingReviews.length * 100}💎</Text>
        </View>
      )}

      {trials.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>No trials yet</Text>
          <Text style={styles.emptySub}>Register for a product trial to get started</Text>
          <Button
            onPress={() => router.replace('/(tabs)/home')}
            label="Browse Products"
            style={{ marginTop: Spacing.xl }}
          />
        </View>
      ) : (
        <FlatList<Trial>
          data={[...trials].reverse()}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TrialCard trial={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.charcoal,
  },
  countBadge: {
    backgroundColor: Colors.blue,
    borderRadius: 12,
    minWidth: 24,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: 'center',
  },
  countText: {
    fontSize: FontSize.sm,
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  callout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.green + '15',
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    borderRadius: 12,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.green + '30',
  },
  calloutEmoji: { fontSize: 24 },
  calloutTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.greenDark,
  },
  calloutSub: { fontSize: FontSize.xs, color: Colors.gray },
  calloutTokens: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    color: Colors.purpleDark,
  },
  list: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.lg },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.charcoal,
    marginBottom: Spacing.sm,
  },
  emptySub: {
    fontSize: FontSize.md,
    color: Colors.gray,
    textAlign: 'center',
  },
});
