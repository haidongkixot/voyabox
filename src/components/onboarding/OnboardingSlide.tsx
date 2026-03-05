import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';

const { width } = Dimensions.get('window');

interface OnboardingSlideProps {
  emoji: string;
  title: string;
  description: string;
  gradientColors: [string, string];
}

export function OnboardingSlide({
  emoji,
  title,
  description,
  gradientColors,
}: OnboardingSlideProps) {
  return (
    <View style={[styles.slide, { width }]}>
      <LinearGradient colors={gradientColors} style={styles.gradient}>
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
      </LinearGradient>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
  },
  gradient: {
    width: '100%',
    height: 380,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  emojiContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 80,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xxxl,
    paddingTop: Spacing.xxxl,
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.charcoal,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSize.lg,
    color: Colors.darkGray,
    textAlign: 'center',
    lineHeight: 26,
  },
});
