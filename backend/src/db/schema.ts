import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  real,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum('role', ['user', 'brand', 'admin']);
export const trialStatusEnum = pgEnum('trial_status', [
  'pending',
  'approved',
  'shipped',
  'completed',
  'rejected',
]);
export const transactionTypeEnum = pgEnum('transaction_type', [
  'trial_register',
  'review',
  'photo_bonus',
  'first_review_bonus',
  'redeem',
  'admin_adjust',
]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    phone: varchar('phone', { length: 20 }),
    address: text('address'),
    avatarUrl: text('avatar_url'),
    role: roleEnum('role').default('user').notNull(),
    tokenBalance: integer('token_balance').default(0).notNull(),
    totalEarned: integer('total_earned').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('users_email_idx').on(t.email), index('users_role_idx').on(t.role)],
);

// ─── Refresh Tokens ───────────────────────────────────────────────────────────

export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('refresh_tokens_token_idx').on(t.token), index('refresh_tokens_user_idx').on(t.userId)],
);

// ─── Brands ───────────────────────────────────────────────────────────────────

export const brands = pgTable(
  'brands',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 150 }).notNull(),
    description: text('description'),
    logoUrl: text('logo_url'),
    website: varchar('website', { length: 255 }),
    category: varchar('category', { length: 80 }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [index('brands_owner_idx').on(t.ownerId)],
);

// ─── Products ─────────────────────────────────────────────────────────────────

export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 200 }).notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    category: varchar('category', { length: 80 }),
    tags: text('tags').array(),
    trialDurationDays: integer('trial_duration_days').default(14).notNull(),
    spotsTotal: integer('spots_total').default(100).notNull(),
    spotsRemaining: integer('spots_remaining').default(100).notNull(),
    avgRating: real('avg_rating').default(0).notNull(),
    reviewCount: integer('review_count').default(0).notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('products_brand_idx').on(t.brandId),
    index('products_category_idx').on(t.category),
    index('products_featured_idx').on(t.isFeatured),
  ],
);

// ─── Trials ───────────────────────────────────────────────────────────────────

export const trials = pgTable(
  'trials',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    status: trialStatusEnum('status').default('pending').notNull(),
    fullName: varchar('full_name', { length: 100 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    shippingAddress: text('shipping_address').notNull(),
    preferredDate: timestamp('preferred_date'),
    adminNote: text('admin_note'),
    hasReview: boolean('has_review').default(false).notNull(),
    tokensAwarded: integer('tokens_awarded').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('trials_user_idx').on(t.userId),
    index('trials_product_idx').on(t.productId),
    index('trials_status_idx').on(t.status),
    uniqueIndex('trials_user_product_idx').on(t.userId, t.productId),
  ],
);

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    trialId: uuid('trial_id')
      .notNull()
      .references(() => trials.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    content: text('content').notNull(),
    photoUrl: text('photo_url'),
    tokensEarned: integer('tokens_earned').default(0).notNull(),
    isFirstReview: boolean('is_first_review').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('reviews_product_idx').on(t.productId),
    index('reviews_user_idx').on(t.userId),
    uniqueIndex('reviews_trial_idx').on(t.trialId),
  ],
);

// ─── Transactions ─────────────────────────────────────────────────────────────

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: transactionTypeEnum('type').notNull(),
    amount: integer('amount').notNull(),
    description: varchar('description', { length: 255 }).notNull(),
    referenceId: uuid('reference_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    index('transactions_user_idx').on(t.userId),
    index('transactions_type_idx').on(t.type),
    index('transactions_created_idx').on(t.createdAt),
  ],
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  trials: many(trials),
  reviews: many(reviews),
  transactions: many(transactions),
  refreshTokens: many(refreshTokens),
  brands: many(brands),
}));

export const brandsRelations = relations(brands, ({ one, many }) => ({
  owner: one(users, { fields: [brands.ownerId], references: [users.id] }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  trials: many(trials),
  reviews: many(reviews),
}));

export const trialsRelations = relations(trials, ({ one }) => ({
  user: one(users, { fields: [trials.userId], references: [users.id] }),
  product: one(products, { fields: [trials.productId], references: [products.id] }),
  review: one(reviews, { fields: [trials.id], references: [reviews.trialId] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  trial: one(trials, { fields: [reviews.trialId], references: [trials.id] }),
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, { fields: [transactions.userId], references: [users.id] }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Trial = typeof trials.$inferSelect;
export type NewTrial = typeof trials.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
