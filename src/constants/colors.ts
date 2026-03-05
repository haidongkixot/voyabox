export const Colors = {
  // Primary brand colors
  blue: '#1CB0F6',
  blueDark: '#1899D6',
  green: '#58CC02',
  greenDark: '#46A302',
  orange: '#FF9600',
  orangeDark: '#E08600',
  purple: '#CE82FF',
  purpleDark: '#9C44FF',
  red: '#FF4B4B',
  redDark: '#EA2B2B',

  // Neutrals
  white: '#FFFFFF',
  offWhite: '#F7F7F7',
  lightGray: '#E5E5E5',
  gray: '#AFAFAF',
  darkGray: '#777777',
  charcoal: '#3C3C3C',
  black: '#1A1A1A',

  // Backgrounds
  background: '#FFFFFF',
  cardBackground: '#F9F9F9',
  inputBackground: '#F0F0F0',

  // Semantic
  success: '#58CC02',
  warning: '#FF9600',
  error: '#FF4B4B',
  info: '#1CB0F6',

  // Token/Reward
  tokenGold: '#FFD700',
  tokenBackground: 'rgba(206, 130, 255, 0.15)',
} as const;

export type ColorKey = keyof typeof Colors;
