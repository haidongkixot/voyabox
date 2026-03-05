import { create } from 'zustand';
import { Trial, Review } from '@/types';
import { getItem, setItem, STORAGE_KEYS } from '@/utils/storage';
import { generateId } from '@/utils/formatters';
import { PRODUCTS } from '@/data';

interface TrialState {
  trials: Trial[];
  reviews: Review[];
  isHydrated: boolean;
  // Actions
  hydrate: () => Promise<void>;
  registerTrial: (
    userId: string,
    productId: string,
    formData: {
      fullName: string;
      address: string;
      phone: string;
      preferredDate: string;
    }
  ) => Promise<Trial>;
  submitReview: (
    userId: string,
    trialId: string,
    productId: string,
    data: { rating: number; text: string; photoUri?: string }
  ) => Promise<{ review: Review; tokensEarned: number; isFirstReview: boolean }>;
  getTrialsByUser: (userId: string) => Trial[];
  getTrialById: (id: string) => Trial | undefined;
  hasUserRegisteredProduct: (userId: string, productId: string) => boolean;
}

export const useTrialStore = create<TrialState>((set, get) => ({
  trials: [],
  reviews: [],
  isHydrated: false,

  hydrate: async () => {
    const trials = (await getItem<Trial[]>(STORAGE_KEYS.TRIALS)) ?? [];
    const reviews = (await getItem<Review[]>(STORAGE_KEYS.REVIEWS)) ?? [];
    // Rehydrate product references
    const hydratedTrials = trials.map((t) => ({
      ...t,
      product: PRODUCTS.find((p) => p.id === t.productId) ?? t.product,
    }));
    set({ trials: hydratedTrials, reviews, isHydrated: true });
  },

  registerTrial: async (userId, productId, formData) => {
    const product = PRODUCTS.find((p) => p.id === productId)!;
    const newTrial: Trial = {
      id: generateId(),
      userId,
      productId,
      product,
      status: 'pending',
      registeredAt: new Date().toISOString(),
      ...formData,
      hasReview: false,
    };

    const trials = [...get().trials, newTrial];
    set({ trials });
    await setItem(STORAGE_KEYS.TRIALS, trials);
    return newTrial;
  },

  submitReview: async (userId, trialId, productId, data) => {
    const { reviews, trials } = get();
    const userReviews = reviews.filter((r) => r.userId === userId);
    const isFirstReview = userReviews.length === 0;

    let tokensEarned = 75; // base review
    if (data.photoUri) tokensEarned += 25;
    if (isFirstReview) tokensEarned += 50;

    const review: Review = {
      id: generateId(),
      userId,
      trialId,
      productId,
      rating: data.rating,
      text: data.text,
      photoUri: data.photoUri,
      createdAt: new Date().toISOString(),
      tokensEarned,
    };

    const newReviews = [...reviews, review];
    const newTrials = trials.map((t) =>
      t.id === trialId ? { ...t, status: 'completed' as const, hasReview: true } : t
    );

    set({ reviews: newReviews, trials: newTrials });
    await setItem(STORAGE_KEYS.REVIEWS, newReviews);
    await setItem(STORAGE_KEYS.TRIALS, newTrials);

    return { review, tokensEarned, isFirstReview };
  },

  getTrialsByUser: (userId) => get().trials.filter((t) => t.userId === userId),

  getTrialById: (id) => get().trials.find((t) => t.id === id),

  hasUserRegisteredProduct: (userId, productId) =>
    get().trials.some((t) => t.userId === userId && t.productId === productId),
}));
