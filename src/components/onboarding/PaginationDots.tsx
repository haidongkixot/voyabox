import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Colors } from '@/constants/colors';

interface PaginationDotsProps {
  count: number;
  activeIndex: number;
  color?: string;
}

export function PaginationDots({ count, activeIndex, color = Colors.blue }: PaginationDotsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <Dot key={i} active={i === activeIndex} color={color} />
      ))}
    </View>
  );
}

function Dot({ active, color }: { active: boolean; color: string }) {
  const style = useAnimatedStyle(() => ({
    width: withTiming(active ? 24 : 8, { duration: 300 }),
    backgroundColor: withTiming(active ? color : '#D1D5DB', { duration: 300 }),
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
