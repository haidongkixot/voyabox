import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and, count, desc, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { reviews, trials, products, users, transactions } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { ok, err, paginated } from '../utils/response.js';
import { calculateReviewTokens } from '../utils/tokens.js';

const router = new Hono();

const reviewSchema = z.object({
  trialId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(10).max(2000),
  photoUrl: z.string().url().optional(),
});

// POST /reviews — submit a review
router.post('/', requireAuth, zValidator('json', reviewSchema), async (c) => {
  const { sub: userId } = c.get('user');
  const body = c.req.valid('json');

  // Validate trial ownership and status
  const trial = await db.query.trials.findFirst({
    where: and(eq(trials.id, body.trialId), eq(trials.userId, userId)),
  });
  if (!trial) return err(c, 'Trial not found or not yours', 404);
  if (trial.hasReview) return err(c, 'You have already reviewed this trial', 409);
  if (!['approved', 'shipped', 'completed'].includes(trial.status)) {
    return err(c, 'Trial must be approved before reviewing', 400);
  }

  // Check if this is user's first review for this product
  const previousReview = await db.query.reviews.findFirst({
    where: and(eq(reviews.productId, trial.productId), eq(reviews.userId, userId)),
  });
  const isFirstReview = !previousReview;

  const tokensEarned = calculateReviewTokens(!!body.photoUrl, isFirstReview);

  const [review] = await db.transaction(async (tx) => {
    const [r] = await tx
      .insert(reviews)
      .values({
        trialId: body.trialId,
        userId,
        productId: trial.productId,
        rating: body.rating,
        content: body.content,
        photoUrl: body.photoUrl,
        tokensEarned,
        isFirstReview,
      })
      .returning();

    // Mark trial as reviewed
    await tx.update(trials).set({ hasReview: true, status: 'completed', updatedAt: new Date() }).where(eq(trials.id, body.trialId));

    // Update product avg rating & review count
    await tx
      .update(products)
      .set({
        reviewCount: sql`${products.reviewCount} + 1`,
        avgRating: sql`(${products.avgRating} * ${products.reviewCount} + ${body.rating}) / (${products.reviewCount} + 1)`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, trial.productId));

    // Award tokens
    await tx
      .update(users)
      .set({
        tokenBalance: sql`${users.tokenBalance} + ${tokensEarned}`,
        totalEarned: sql`${users.totalEarned} + ${tokensEarned}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Transaction entries
    const txEntries: Array<{ userId: string; type: any; amount: number; description: string; referenceId: string }> = [
      { userId, type: 'review', amount: 75, description: 'Viết đánh giá sản phẩm', referenceId: r.id },
    ];
    if (body.photoUrl) {
      txEntries.push({ userId, type: 'photo_bonus', amount: 25, description: 'Bonus upload ảnh', referenceId: r.id });
    }
    if (isFirstReview) {
      txEntries.push({ userId, type: 'first_review_bonus', amount: 50, description: 'Bonus đánh giá đầu tiên', referenceId: r.id });
    }
    await tx.insert(transactions).values(txEntries);

    return [r];
  });

  return ok(c, { review, tokensEarned }, 201);
});

// GET /reviews/my — user's reviews
router.get('/my', requireAuth, async (c) => {
  const { sub: userId } = c.get('user');
  const page = Number(c.req.query('page') ?? 1);
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 100);
  const offset = (page - 1) * limit;

  const [items, [{ total }]] = await Promise.all([
    db.query.reviews.findMany({
      where: eq(reviews.userId, userId),
      limit,
      offset,
      orderBy: [desc(reviews.createdAt)],
      with: { product: { columns: { id: true, name: true, imageUrl: true } } },
    }),
    db.select({ total: count() }).from(reviews).where(eq(reviews.userId, userId)),
  ]);

  return paginated(c, items, Number(total), page, limit);
});

// GET /reviews/product/:productId — public reviews for a product
router.get('/product/:productId', async (c) => {
  const page = Number(c.req.query('page') ?? 1);
  const limit = Math.min(Number(c.req.query('limit') ?? 10), 50);
  const offset = (page - 1) * limit;
  const where = eq(reviews.productId, c.req.param('productId') as string);

  const [items, [{ total }]] = await Promise.all([
    db.query.reviews.findMany({
      where,
      limit,
      offset,
      orderBy: [desc(reviews.createdAt)],
      with: { user: { columns: { id: true, name: true, avatarUrl: true } } },
    }),
    db.select({ total: count() }).from(reviews).where(where),
  ]);

  return paginated(c, items, Number(total), page, limit);
});

// GET /reviews/:id
router.get('/:id', async (c) => {
  const review = await db.query.reviews.findFirst({
    where: eq(reviews.id, c.req.param('id') as string),
    with: {
      user: { columns: { id: true, name: true, avatarUrl: true } },
      product: { columns: { id: true, name: true, imageUrl: true } },
    },
  });
  if (!review) return err(c, 'Review not found', 404);
  return ok(c, review);
});

export default router;
