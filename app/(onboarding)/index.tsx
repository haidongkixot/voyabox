import React, { useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Text,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingSlide } from '@/components/onboarding/OnboardingSlide';
import { PaginationDots } from '@/components/onboarding/PaginationDots';
import { Button } from '@/components/common/Button';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { setItem, STORAGE_KEYS } from '@/utils/storage';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '🎁',
    title: 'Discover Products',
    description:
      'Try the latest products from top brands before they hit the market. Be the first to experience innovation!',
    gradientColors: ['#1CB0F6', '#0E8FCC'] as [string, string],
  },
  {
    emoji: '⭐',
    title: 'Share Your Story',
    description:
      'Write honest reviews and upload photos of your experience. Your opinion matters to brands and other users!',
    gradientColors: ['#FF9600', '#E07800'] as [string, string],
  },
  {
    emoji: '💎',
    title: 'Earn Rewards',
    description:
      'Get tokens for every trial you complete. Level up, unlock badges, and redeem exciting rewards!',
    gradientColors: ['#CE82FF', '#9C44FF'] as [string, string],
  },
];

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(idx);
  }

  async function handleGetStarted() {
    await setItem(STORAGE_KEYS.ONBOARDING_SEEN, 'true');
    router.replace('/(auth)/login');
  }

  function handleNext() {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
    } else {
      handleGetStarted();
    }
  }

  function handleSkip() {
    handleGetStarted();
  }

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.skipRow}>
        {!isLast && (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skip}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, index) => (
          <OnboardingSlide key={index} {...slide} />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <PaginationDots
          count={SLIDES.length}
          activeIndex={activeIndex}
          color={SLIDES[activeIndex]?.gradientColors[0]}
        />
        <Button
          onPress={handleNext}
          label={isLast ? 'Get Started' : 'Next'}
          size="lg"
          fullWidth
          variant={isLast ? 'secondary' : 'primary'}
          style={{ marginTop: Spacing.xl }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  skipRow: {
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    minHeight: 40,
  },
  skip: {
    fontSize: FontSize.md,
    color: Colors.gray,
    fontWeight: FontWeight.semibold,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.lg,
    alignItems: 'center',
  },
});
