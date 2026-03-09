import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, count, desc, and, sql, gte, lte, ilike, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, brands, products, trials, reviews, transactions } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { ok, err, paginated } from '../utils/response.js';
import { TOKEN_RULES } from '../utils/tokens.js';

const router = new Hono();

// All admin routes require auth + admin role
router.use('*', requireAuth, async (c, next) => {
  if (c.get('user').role !== 'admin') return err(c, 'Forbidden', 403);
  await next();
});

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

// GET /admin/stats
router.get('/stats', async (c) => {
  const [
    [{ totalUsers }],
    [{ totalBrands }],
    [{ totalProducts }],
    [{ totalTrials }],
    [{ pendingTrials }],
    [{ totalReviews }],
    [{ tokensIssued }],
  ] = await Promise.all([
    db.select({ totalUsers: count() }).from(users).where(eq(users.role, 'user')),
    db.select({ totalBrands: count() }).from(brands).where(eq(brands.isActive, true)),
    db.select({ totalProducts: count() }).from(products).where(eq(products.isActive, true)),
    db.select({ totalTrials: count() }).from(trials),
    db.select({ pendingTrials: count() }).from(trials).where(eq(trials.status, 'pending')),
    db.select({ totalReviews: count() }).from(reviews),
    db.select({ tokensIssued: sql<number>`coalesce(sum(amount), 0)` }).from(transactions).where(sql`amount > 0`),
  ]);

  // Trial status breakdown
  const trialsByStatus = await db
    .select({ status: trials.status, count: count() })
    .from(trials)
    .groupBy(trials.status);

  // Top products by trial count
  const topProducts = await db
    .select({
      productId: trials.productId,
      name: products.name,
      trialCount: count(),
    })
    .from(trials)
    .innerJoin(products, eq(trials.productId, products.id))
    .groupBy(trials.productId, products.name)
    .orderBy(desc(count()))
    .limit(5);

  return ok(c, {
    totalUsers: Number(totalUsers),
    totalBrands: Number(totalBrands),
    totalProducts: Number(totalProducts),
    totalTrials: Number(totalTrials),
    pendingTrials: Number(pendingTrials),
    totalReviews: Number(totalReviews),
    tokensIssued: Number(tokensIssued),
    trialsByStatus: Object.fromEntries(trialsByStatus.map((r) => [r.status, Number(r.count)])),
    topProducts,
  });
});

// ─── User Management ─────────────────────────────────────────────────────────

// GET /admin/users
router.get('/users', async (c) => {
  const page = Number(c.req.query('page') ?? 1);
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 100);
  const search = c.req.query('search');
  const role = c.req.query('role');
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (search) {
    conditions.push(or(ilike(users.name, `%${search}%`), ilike(users.email, `%${search}%`)));
  }
  if (role) conditions.push(eq(users.role, role as any));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, [{ total }]] = await Promise.all([
    db.query.users.findMany({
      where,
      limit,
      offset,
      orderBy: [desc(users.createdAt)],
      columns: { passwordHash: false },
    }),
    db.select({ total: count() }).from(users).where(where),
  ]);

  return paginated(c, items, Number(total), page, limit);
});

// GET /admin/users/:id
router.get('/users/:id', async (c) => {
  const user = await db.query.users.findFirst({
    where: eq(users.id, c.req.param('id') as string),
    columns: { passwordHash: false },
    with: {
      trials: {
        limit: 10,
        orderBy: (t, { desc }) => [desc(t.createdAt)],
        with: { product: { columns: { id: true, name: true, imageUrl: true } } },
      },
      reviews: { limit: 10, orderBy: (r, { desc }) => [desc(r.createdAt)] },
      transactions: { limit: 20, orderBy: (t, { desc }) => [desc(t.createdAt)] },
    },
  });
  if (!user) return err(c, 'User not found', 404);
  return ok(c, user);
});

// PATCH /admin/users/:id
router.patch(
  '/users/:id',
  zValidator('json', z.object({
    isActive: z.boolean().optional(),
    role: z.enum(['user', 'brand', 'admin']).optional(),
    tokenBalance: z.number().int().min(0).optional(),
  })),
  async (c) => {
    const body = c.req.valid('json');
    const adminId = c.get('user').sub;

    if (body.tokenBalance !== undefined) {
      // Calculate diff and record adjustment transaction
      const user = await db.query.users.findFirst({ where: eq(users.id, c.req.param('id') as string) });
      if (!user) return err(c, 'User not found', 404);
      const diff = body.tokenBalance - user.tokenBalance;
      if (diff !== 0) {
        await db.insert(transactions).values({
          userId: user.id,
          type: 'admin_adjust',
          amount: diff,
          description: `Admin adjustment by ${adminId}`,
          referenceId: adminId,
        });
        // Also adjust totalEarned if positive
        if (diff > 0) {
          await db.update(users).set({
            totalEarned: sql`${users.totalEarned} + ${diff}`,
          }).where(eq(users.id, user.id));
        }
      }
    }

    const [updated] = await db
      .update(users)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(users.id, c.req.param('id') as string))
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role, isActive: users.isActive, tokenBalance: users.tokenBalance });

    if (!updated) return err(c, 'User not found', 404);
    return ok(c, updated);
  },
);

// ─── Trial Management ─────────────────────────────────────────────────────────

// GET /admin/trials
router.get('/trials', async (c) => {
  const page = Number(c.req.query('page') ?? 1);
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 100);
  const status = c.req.query('status');
  const productId = c.req.query('productId');
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (status) conditions.push(eq(trials.status, status as any));
  if (productId) conditions.push(eq(trials.productId, productId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, [{ total }]] = await Promise.all([
    db.query.trials.findMany({
      where,
      limit,
      offset,
      orderBy: [desc(trials.createdAt)],
      with: {
        user: { columns: { id: true, name: true, email: true, phone: true } },
        product: { columns: { id: true, name: true, imageUrl: true }, with: { brand: { columns: { id: true, name: true } } } },
        review: { columns: { id: true, rating: true, createdAt: true } },
      },
    }),
    db.select({ total: count() }).from(trials).where(where),
  ]);

  return paginated(c, items, Number(total), page, limit);
});

// PATCH /admin/trials/:id/status
router.patch(
  '/trials/:id/status',
  zValidator('json', z.object({
    status: z.enum(['approved', 'shipped', 'completed', 'rejected']),
    adminNote: z.string().optional(),
  })),
  async (c) => {
    const { status, adminNote } = c.req.valid('json');
    const trial = await db.query.trials.findFirst({ where: eq(trials.id, c.req.param('id') as string) });
    if (!trial) return err(c, 'Trial not found', 404);

    const [updated] = await db
      .update(trials)
      .set({ status, adminNote, updatedAt: new Date() })
      .where(eq(trials.id, trial.id))
      .returning();

    return ok(c, updated);
  },
);

// ─── Review Management ────────────────────────────────────────────────────────

// GET /admin/reviews
router.get('/reviews', async (c) => {
  const page = Number(c.req.query('page') ?? 1);
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 100);
  const productId = c.req.query('productId');
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (productId) conditions.push(eq(reviews.productId, productId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [items, [{ total }]] = await Promise.all([
    db.query.reviews.findMany({
      where,
      limit,
      offset,
      orderBy: [desc(reviews.createdAt)],
      with: {
        user: { columns: { id: true, name: true, email: true } },
        product: { columns: { id: true, name: true }, with: { brand: { columns: { id: true, name: true } } } },
      },
    }),
    db.select({ total: count() }).from(reviews).where(where),
  ]);

  return paginated(c, items, Number(total), page, limit);
});

// ─── Brand Management ─────────────────────────────────────────────────────────

// PATCH /admin/brands/:id/assign-owner
router.patch(
  '/brands/:id/assign-owner',
  zValidator('json', z.object({ userId: z.string().uuid().nullable() })),
  async (c) => {
    const { userId } = c.req.valid('json');
    const [updated] = await db
      .update(brands)
      .set({ ownerId: userId, updatedAt: new Date() })
      .where(eq(brands.id, c.req.param('id') as string))
      .returning();
    if (!updated) return err(c, 'Brand not found', 404);
    return ok(c, updated);
  },
);

// ─── Analytics ────────────────────────────────────────────────────────────────

// GET /admin/analytics?from=2024-01-01&to=2024-12-31
router.get('/analytics', async (c) => {
  const from = c.req.query('from') ? new Date(c.req.query('from')!) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = c.req.query('to') ? new Date(c.req.query('to')!) : new Date();

  const [newUsers, newTrials, newReviews, tokensByType] = await Promise.all([
    db
      .select({ count: count() })
      .from(users)
      .where(and(gte(users.createdAt, from), lte(users.createdAt, to))),
    db
      .select({ count: count() })
      .from(trials)
      .where(and(gte(trials.createdAt, from), lte(trials.createdAt, to))),
    db
      .select({ count: count() })
      .from(reviews)
      .where(and(gte(reviews.createdAt, from), lte(reviews.createdAt, to))),
    db
      .select({ type: transactions.type, total: sql<number>`sum(amount)`, count: count() })
      .from(transactions)
      .where(and(gte(transactions.createdAt, from), lte(transactions.createdAt, to), sql`amount > 0`))
      .groupBy(transactions.type),
  ]);

  return ok(c, {
    period: { from, to },
    newUsers: Number(newUsers[0].count),
    newTrials: Number(newTrials[0].count),
    newReviews: Number(newReviews[0].count),
    tokensByType: Object.fromEntries(
      tokensByType.map((r) => [r.type, { total: Number(r.total), count: Number(r.count) }]),
    ),
  });
});

export default router;
