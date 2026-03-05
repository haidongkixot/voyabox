// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

// ─── Products ─────────────────────────────────────────────────────────────────
export interface Brand {
  id: string;
  name: string;
  logo: string;
  description: string;
  category: ProductCategory;
}

export type ProductCategory =
  | 'skincare'
  | 'haircare'
  | 'food'
  | 'beverage'
  | 'household'
  | 'electronics'
  | 'fashion';

export interface Product {
  id: string;
  brandId: string;
  brand: Brand;
  name: string;
  description: string;
  image: string;
  category: ProductCategory;
  trialDuration: number; // days
  spotsTotal: number;
  spotsRemaining: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  featured: boolean;
}

// ─── Trials ───────────────────────────────────────────────────────────────────
export type TrialStatus = 'pending' | 'approved' | 'in_progress' | 'completed' | 'rejected';

export interface Trial {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  status: TrialStatus;
  registeredAt: string;
  // Registration form data
  fullName: string;
  address: string;
  phone: string;
  preferredDate: string;
  // Review
  hasReview: boolean;
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
export interface Review {
  id: string;
  userId: string;
  trialId: string;
  productId: string;
  rating: number; // 1-5
  text: string;
  photoUri?: string;
  createdAt: string;
  tokensEarned: number;
}

// ─── Rewards ──────────────────────────────────────────────────────────────────
export type TransactionType = 'trial_register' | 'review' | 'photo' | 'first_review_bonus';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  description: string;
  createdAt: string;
  referenceId?: string; // trialId or reviewId
}

export interface RewardState {
  balance: number;
  totalEarned: number;
  transactions: Transaction[];
  level: number;
  xp: number;
}

// ─── Token Rules ──────────────────────────────────────────────────────────────
export const TOKEN_RULES = {
  trial_register: 25,
  review: 75,
  photo: 25,
  first_review_bonus: 50,
} as const;

export const XP_PER_LEVEL = 500;

export const LEVEL_NAMES = [
  'Newbie',
  'Explorer',
  'Tester',
  'Expert',
  'Champion',
  'Legend',
] as const;

export function getLevelName(level: number): string {
  return LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length - 1)] ?? 'Legend';
}
