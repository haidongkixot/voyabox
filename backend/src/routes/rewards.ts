import { Hono } from 'hono';
import { eq, count, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, transactions } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { ok, err, paginated } from '../utils/response.js';
import { getLevel } from '../utils/tokens.js';

const router = new Hono();

// GET /rewards/balance
router.get('/balance', requireAuth, async (c) => {
  const { sub: userId } = c.get('user');
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { tokenBalance: true, totalEarned: true },
  });
  if (!user) return err(c, 'User not found', 404);
  return ok(c, { tokenBalance: user.tokenBalance, ...getLevel(user.totalEarned) });
});

// GET /rewards/history
router.get('/history', requireAuth, async (c) => {
  const { sub: userId } = c.get('user');
  const page = Number(c.req.query('page') ?? 1);
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 100);
  const offset = (page - 1) * limit;

  const where = eq(transactions.userId, userId);
  const [items, [{ total }]] = await Promise.all([
    db.query.transactions.findMany({
      where,
      limit,
      offset,
      orderBy: [desc(transactions.createdAt)],
    }),
    db.select({ total: count() }).from(transactions).where(where),
  ]);

  return paginated(c, items, Number(total), page, limit);
});

export default router;
