import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { ProductCard } from '@/components/home/ProductCard';
import { CategoryFilter } from '@/components/home/CategoryFilter';
import { FeaturedBanner } from '@/components/home/FeaturedBanner';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useProductStore } from '@/store/useProductStore';
import { useRewardStore } from '@/store/useRewardStore';
import { useAuthStore } from '@/store/useAuthStore';
import { CATEGORIES } from '@/data/products';
import { Product } from '@/types';
import { formatTokens } from '@/utils/formatters';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Product>);

export default function HomeScreen() {
  const { selectedCategory, setCategory, filteredProducts, featuredProducts } = useProductStore();
  const balance = useRewardStore((s) => s.balance);
  const user = useAuthStore((s) => s.currentUser);
  const scrollY = useSharedValue(0);

  const products = filteredProducts();
  const featured = featuredProducts();

  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 60], [1, 0], Extrapolation.CLAMP),
  }));

  const renderProduct: ListRenderItem<Product> = useCallback(
    ({ item, index }) => (
      <View style={{ marginLeft: index % 2 === 0 ? Spacing.xl : Spacing.sm / 2, marginRight: index % 2 !== 0 ? Spacing.xl : Spacing.sm / 2 }}>
        <ProductCard product={item} />
      </View>
    ),
    []
  );

  const ListHeader = (
    <View>
      {/* Welcome header */}
      <Animated.View style={[styles.welcome, headerStyle]}>
        <View>
          <Text style={styles.greeting}>Hi, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.subtitle}>Find your next trial</Text>
        </View>
        <View style={styles.tokenPill}>
          <Text style={styles.tokenEmoji}>💎</Text>
          <Text style={styles.tokenCount}>{formatTokens(balance)}</Text>
        </View>
      </Animated.View>

      {/* Featured Banner */}
      {featured.length > 0 && (
        <View style={{ marginBottom: Spacing.xl }}>
          <FeaturedBanner products={featured} />
        </View>
      )}

      {/* Category filter */}
      <CategoryFilter
        categories={CATEGORIES}
        selected={selectedCategory}
        onSelect={setCategory}
      />

      {/* Section title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {selectedCategory === 'all' ? 'All Products' : CATEGORIES.find(c => c.id === selectedCategory)?.label}
        </Text>
        <Text style={styles.sectionCount}>{products.length} trials</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedFlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={ListHeader}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  welcome: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  greeting: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.charcoal,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.gray,
    marginTop: 2,
  },
  tokenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.tokenBackground,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.purple + '40',
  },
  tokenEmoji: { fontSize: 16 },
  tokenCount: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.extrabold,
    color: Colors.purpleDark,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.charcoal,
  },
  sectionCount: {
    fontSize: FontSize.sm,
    color: Colors.gray,
  },
  list: {
    paddingBottom: Spacing.xxxl,
  },
  empty: {
    alignItems: 'center',
    paddingTop: Spacing.massive,
  },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyText: {
    fontSize: FontSize.lg,
    color: Colors.gray,
    fontWeight: FontWeight.semibold,
  },
});
