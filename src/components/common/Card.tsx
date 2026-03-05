import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadow, Spacing } from '@/constants/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  shadow?: 'small' | 'medium' | 'large' | 'none';
  padding?: number;
}

export function Card({ children, style, shadow = 'small', padding = Spacing.lg }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        shadow !== 'none' ? Shadow[shadow] : undefined,
        { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'visible',
  },
});
