import React, { useRef, useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Product } from '@/types';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - Spacing.xl * 2;

interface FeaturedBannerProps {
  products: Product[];
}

export function FeaturedBanner({ products }: FeaturedBannerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (products.length <= 1) return;
    const interval = setInterval(() => {
      const next = (activeIndex + 1) % products.length;
      scrollRef.current?.scrollTo({ x: next * BANNER_WIDTH, animated: true });
      setActiveIndex(next);
    }, 3500);
    return () => clearInterval(interval);
  }, [activeIndex, products.length]);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
    setActiveIndex(idx);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        snapToInterval={BANNER_WIDTH}
        decelerationRate="fast"
        style={styles.scroll}
      >
        {products.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={styles.banner}
            onPress={() => router.push(`/(tabs)/home/${product.id}`)}
            activeOpacity={0.95}
          >
            <Image
              source={{ uri: product.image }}
              style={styles.image}
              contentFit="cover"
              transition={300}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.75)']}
              style={styles.gradient}
            />
            <View style={styles.textContent}>
              <View style={styles.brandBadge}>
                <Text style={styles.brandBadgeText}>{product.brand.name}</Text>
              </View>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.trialInfo}>{product.trialDuration}-day trial • {product.spotsRemaining} spots left</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Dots */}
      {products.length > 1 && (
        <View style={styles.dots}>
          {products.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
  },
  scroll: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  banner: {
    width: BANNER_WIDTH,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
  },
  textContent: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  brandBadge: {
    backgroundColor: Colors.orange,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  brandBadgeText: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  productName: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.white,
    marginBottom: 4,
  },
  trialInfo: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.85)',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.lightGray,
  },
  dotActive: {
    backgroundColor: Colors.blue,
    width: 18,
  },
});
