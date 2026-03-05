import { create } from 'zustand';
import { Product, ProductCategory } from '@/types';
import { PRODUCTS } from '@/data';

interface ProductState {
  products: Product[];
  selectedCategory: string;
  searchQuery: string;
  // Computed
  filteredProducts: () => Product[];
  featuredProducts: () => Product[];
  getProductById: (id: string) => Product | undefined;
  // Actions
  setCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: PRODUCTS,
  selectedCategory: 'all',
  searchQuery: '',

  filteredProducts: () => {
    const { products, selectedCategory, searchQuery } = get();
    let filtered = products;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.name.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return filtered;
  },

  featuredProducts: () => {
    return get().products.filter((p) => p.featured);
  },

  getProductById: (id) => {
    return get().products.find((p) => p.id === id);
  },

  setCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
