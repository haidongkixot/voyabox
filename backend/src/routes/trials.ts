import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, count, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { trials, products, users, transactions } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { ok, err, paginated } from '../utils/response.js';
import { TOKEN_RULES } from '../utils/tokens.js';

const router = new Hono();

const registerSchema = z.object({
  productId: z.string().uuid(),
  fullName: z.string().min(2).max(100),
  phone: z.string().min(8).max(20),
  shippingAddress: z.string().min(5),
  preferredDate: z.string().datetime().optional(),
});

// POST /trials — user registers for a product trial
router.post('/', requireAuth, zValidator('json', registerSchema), async (c) => {
  const { sub: userId } = c.get('user');
  const body = c.req.valid('json');

  // Check product exists and has spots
  const product = await db.query.products.findFirst({
    where: and(eq(products.id, body.productId), eq(products.isActive, true)),
  });
  if (!product) return err(c, 'Product not found', 404);
  if (product.spotsRemaining <= 0) return err(c, 'No trial spots remaining for this product', 409);

  // Prevent duplicate trial
  const existing = await db.query.trials.findFirst({
    where: and(eq(trials.userId, userId), eq(trials.productId, body.productId)),
  });
  if (existing) return err(c, 'You have already registered for a trial of this product', 409);

  // Create trial & award tokens in a transaction
  const [trial] = await db.transaction(async (tx) => {
    const [t] = await tx
      .insert(trials)
      .values({
        userId,
        productId: body.productId,
        fullName: body.fullName,
        phone: body.phone,
        shippingAddress: body.shippingAddress,
        preferredDate: body.preferredDate ? new Date(body.preferredDate) : undefined,
        tokensAwarded: TOKEN_RULES.TRIAL_REGISTER,
      })
      .returning();

    // Decrement spots
    await tx
      .update(products)
      .set({
        spotsRemaining: sql`${products.spotsRemaining} - 1`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, body.productId));

    // Award tokens
    await tx
      .update(users)
      .set({
        tokenBalance: sql`${users.tokenBalance} + ${TOKEN_RULES.TRIAL_REGISTER}`,
        totalEarned: sql`${users.totalEarned} + ${TOKEN_RULES.TRIAL_REGISTER}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    await tx.insert(transactions).values({
      userId,
      type: 'trial_register',
      amount: TOKEN_RULES.TRIAL_REGISTER,
      description: `Đăng ký dùng thử: ${product.name}`,
      referenceId: t.id,
    });

    return [t];
  });

  return ok(c, { trial, tokensEarned: TOKEN_RULES.TRIAL_REGISTER }, 201);
});

// GET /trials/my — current user's trials
router.get('/my', requireAuth, async (c) => {
  const { sub: userId } = c.get('user');
  const page = Number(c.req.query('page') ?? 1);
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 100);
  const status = c.req.query('status');
  const offset = (page - 1) * limit;

  const conditions = [eq(trials.userId, userId)];
  if (status) conditions.push(eq(trials.status, status as any));

  const where = and(...conditions);
  const [items, [{ total }]] = await Promise.all([
    db.query.trials.findMany({
      where,
      limit,
      offset,
      orderBy: [desc(trials.createdAt)],
      with: {
        product: {
          columns: { id: true, name: true, imageUrl: true, category: true },
          with: { brand: { columns: { id: true, name: true, logoUrl: true } } },
        },
        review: { columns: { id: true, rating: true, createdAt: true } },
      },
    }),
    db.select({ total: count() }).from(trials).where(where),
  ]);

  return paginated(c, items, Number(total), page, limit);
});

// GET /trials/:id
router.get('/:id', requireAuth, async (c) => {
  const id = c.req.param('id') as string;
  const { sub: userId, role } = c.get('user');
  const trial = await db.query.trials.findFirst({
    where: eq(trials.id, id),
    with: {
      product: { with: { brand: true } },
      user: { columns: { id: true, name: true, email: true, phone: true } },
      review: true,
    },
  });
  if (!trial) return err(c, 'Trial not found', 404);
  // Users can only see their own trials
  if (role === 'user' && trial.userId !== userId) return err(c, 'Forbidden', 403);
  return ok(c, trial);
});

export default router;
