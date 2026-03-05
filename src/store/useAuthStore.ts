import { create } from 'zustand';
import { User } from '@/types';
import { getItem, setItem, removeItem, STORAGE_KEYS } from '@/utils/storage';
import { generateId } from '@/utils/formatters';

interface AuthState {
  currentUser: User | null;
  isHydrated: boolean;
  // Actions
  hydrate: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isHydrated: false,

  hydrate: async () => {
    const user = await getItem<User>(STORAGE_KEYS.CURRENT_USER);
    set({ currentUser: user, isHydrated: true });
  },

  signup: async (email, password, name) => {
    const users = (await getItem<User[]>(STORAGE_KEYS.USERS)) ?? [];
    const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) return { error: 'Email already registered' };

    const newUser: User = {
      id: generateId(),
      email: email.toLowerCase().trim(),
      password,
      name: name.trim(),
      createdAt: new Date().toISOString(),
    };

    await setItem(STORAGE_KEYS.USERS, [...users, newUser]);
    await setItem(STORAGE_KEYS.CURRENT_USER, newUser);
    set({ currentUser: newUser });
    return {};
  },

  login: async (email, password) => {
    const users = (await getItem<User[]>(STORAGE_KEYS.USERS)) ?? [];
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) return { error: 'Invalid email or password' };

    await setItem(STORAGE_KEYS.CURRENT_USER, user);
    set({ currentUser: user });
    return {};
  },

  logout: async () => {
    await removeItem(STORAGE_KEYS.CURRENT_USER);
    set({ currentUser: null });
  },
}));
