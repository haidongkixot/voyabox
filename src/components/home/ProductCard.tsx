import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Product } from '@/types';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight } from '@/constants/typography';
import { Spacing, BorderRadius, Shadow } from '@/constants/spacing';

const CARD_WIDTH = (Dimensions.get('window').width - Spacing.xl * 2 - Spacing.md) / 2;

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const spotsLeft = product.spotsRemaining;
  const urgency = spotsLeft <= 20;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(tabs)/home/${product.id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.image }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
        {product.featured && (
          <LinearGradient colors={['#FF9600', '#FF6B00']} style={styles.featuredBadge}>
            <Text style={styles.featuredText}>⭐ Featured</Text>
          </LinearGradient>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.brand}>{product.brand.name}</Text>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.rating}>⭐ {product.rating}</Text>
          <Text style={[styles.spots, urgency && styles.spotsUrgent]}>
            {urgency ? '🔥' : ''} {spotsLeft} left
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadow.small,
    marginBottom: Spacing.md,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: CARD_WIDTH * 0.9,
  },
  featuredBadge: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  featuredText: {
    fontSize: FontSize.xs,
    color: Colors.white,
    fontWeight: FontWeight.bold,
  },
  info: {
    padding: Spacing.sm,
  },
  brand: {
    fontSize: FontSize.xs,
    color: Colors.blue,
    fontWeight: FontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.charcoal,
    marginTop: 2,
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    fontSize: FontSize.xs,
    color: Colors.darkGray,
  },
  spots: {
    fontSize: FontSize.xs,
    color: Colors.green,
    fontWeight: FontWeight.semibold,
  },
  spotsUrgent: {
    color: Colors.red,
  },
});
