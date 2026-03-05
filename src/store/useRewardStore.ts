import { create } from 'zustand';
import { RewardState, Transaction, TransactionType, TOKEN_RULES, XP_PER_LEVEL } from '@/types';
import { getItem, setItem, STORAGE_KEYS } from '@/utils/storage';
import { generateId } from '@/utils/formatters';

const INITIAL_STATE: RewardState = {
  balance: 0,
  totalEarned: 0,
  transactions: [],
  level: 0,
  xp: 0,
};

interface RewardStoreState extends RewardState {
  isHydrated: boolean;
  hydrate: (userId: string) => Promise<void>;
  addTokens: (
    userId: string,
    type: TransactionType,
    amount: number,
    description: string,
    referenceId?: string
  ) => Promise<void>;
  addTrialRegisterTokens: (userId: string, referenceId: string) => Promise<void>;
  getUserKey: (userId: string) => string;
}

export const useRewardStore = create<RewardStoreState>((set, get) => ({
  ...INITIAL_STATE,
  isHydrated: false,

  getUserKey: (userId) => `${STORAGE_KEYS.REWARDS}:${userId}`,

  hydrate: async (userId) => {
    const key = get().getUserKey(userId);
    const state = (await getItem<RewardState>(key)) ?? INITIAL_STATE;
    set({ ...state, isHydrated: true });
  },

  addTokens: async (userId, type, amount, description, referenceId) => {
    const { balance, totalEarned, transactions, xp, level } = get();
    const newBalance = balance + amount;
    const newTotalEarned = totalEarned + amount;
    const newXp = xp + amount;
    const newLevel = Math.floor(newXp / XP_PER_LEVEL);

    const transaction: Transaction = {
      id: generateId(),
      userId,
      type,
      amount,
      description,
      createdAt: new Date().toISOString(),
      referenceId,
    };

    const newState: RewardState = {
      balance: newBalance,
      totalEarned: newTotalEarned,
      transactions: [transaction, ...transactions],
      level: newLevel,
      xp: newXp,
    };

    set(newState);
    const key = get().getUserKey(userId);
    await setItem(key, newState);
  },

  addTrialRegisterTokens: async (userId, referenceId) => {
    await get().addTokens(userId, 'trial_register', TOKEN_RULES.trial_register, 'Registered for trial', referenceId);
  },
}));
