import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { FontSize, FontWeight } from '@/constants/typography';
import { BorderRadius } from '@/constants/spacing';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: boolean;
}

const VARIANT_CONFIG: Record<
  ButtonVariant,
  { bg: string; border: string; text: string; shadow: string }
> = {
  primary: {
    bg: Colors.blue,
    border: Colors.blueDark,
    text: Colors.white,
    shadow: Colors.blueDark,
  },
  secondary: {
    bg: Colors.green,
    border: Colors.greenDark,
    text: Colors.white,
    shadow: Colors.greenDark,
  },
  outline: {
    bg: Colors.white,
    border: Colors.blue,
    text: Colors.blue,
    shadow: Colors.lightGray,
  },
  ghost: {
    bg: 'transparent',
    border: 'transparent',
    text: Colors.blue,
    shadow: 'transparent',
  },
  danger: {
    bg: Colors.red,
    border: Colors.redDark,
    text: Colors.white,
    shadow: Colors.redDark,
  },
};

const SIZE_CONFIG: Record<ButtonSize, { height: number; fontSize: number; paddingH: number }> = {
  sm: { height: 36, fontSize: FontSize.sm, paddingH: 16 },
  md: { height: 48, fontSize: FontSize.md, paddingH: 24 },
  lg: { height: 56, fontSize: FontSize.lg, paddingH: 32 },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  onPress,
  label,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  haptic = true,
}: ButtonProps) {
  const pressed = useSharedValue(0);
  const config = VARIANT_CONFIG[variant];
  const sizeConfig = SIZE_CONFIG[size];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(pressed.value * 4, { duration: 80 }) }],
    borderBottomWidth: withTiming(pressed.value ? 0 : 4, { duration: 80 }),
  }));

  function handlePressIn() {
    pressed.value = 1;
  }

  function handlePressOut() {
    pressed.value = 0;
  }

  async function handlePress() {
    if (haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }

  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        styles.base,
        {
          backgroundColor: isDisabled ? Colors.lightGray : config.bg,
          borderColor: isDisabled ? Colors.gray : config.border,
          borderBottomColor: isDisabled ? Colors.gray : config.shadow,
          height: sizeConfig.height,
          paddingHorizontal: sizeConfig.paddingH,
          alignSelf: fullWidth ? 'stretch' : 'auto',
          borderWidth: variant === 'outline' ? 2 : 0,
        },
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isDisabled ? Colors.gray : config.text} size="small" />
      ) : (
        <Text
          style={[
            styles.label,
            {
              color: isDisabled ? Colors.gray : config.text,
              fontSize: sizeConfig.fontSize,
            },
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderBottomWidth: 4,
  },
  label: {
    fontWeight: FontWeight.bold,
    letterSpacing: 0.3,
  },
});
