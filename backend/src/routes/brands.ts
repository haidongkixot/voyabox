import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, ilike, and, count, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { brands } from '../db/schema.js';
import { requireAuth, requireBrandOrAdmin } from '../middleware/auth.js';
import { ok, err, paginated } from '../utils/response.js';

const router = new Hono();

const brandSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  category: z.string().optional(),
});

// GET /brands
router.get('/', async (c) => {
  const page = Number(c.req.query('page') ?? 1);
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 100);
  const search = c.req.query('search');
  const offset = (page - 1) * limit;

  const conditions = [eq(brands.isActive, true)];
  if (search) conditions.push(ilike(brands.name, `%${search}%`));

  const where = and(...conditions);
  const [items, [{ total }]] = await Promise.all([
    db.query.brands.findMany({
      where,
      limit,
      offset,
      orderBy: [desc(brands.createdAt)],
      with: { products: { columns: { id: true }, where: eq(brands.isActive, true) } },
    }),
    db.select({ total: count() }).from(brands).where(where),
  ]);

  return paginated(c, items, Number(total), page, limit);
});

// GET /brands/:id
router.get('/:id', async (c) => {
  const id = c.req.param('id') as string;
  const brand = await db.query.brands.findFirst({
    where: and(eq(brands.id, id), eq(brands.isActive, true)),
    with: { products: { where: eq(brands.isActive, true) } },
  });
  if (!brand) return err(c, 'Brand not found', 404);
  return ok(c, brand);
});

// POST /brands — admin only
router.post('/', requireAuth, async (c) => {
  const user = c.get('user');
  if (user.role !== 'admin') return err(c, 'Forbidden', 403);

  const body = await c.req.json();
  const parsed = brandSchema.safeParse(body);
  if (!parsed.success) return err(c, parsed.error.message, 422);

  const [brand] = await db.insert(brands).values(parsed.data).returning();
  return ok(c, brand, 201);
});

// PATCH /brands/:id — brand owner or admin
router.patch('/:id', requireAuth, async (c) => {
  const id = c.req.param('id') as string;
  const user = c.get('user');
  const brand = await db.query.brands.findFirst({ where: eq(brands.id, id) });
  if (!brand) return err(c, 'Brand not found', 404);

  if (user.role !== 'admin' && brand.ownerId !== user.sub) return err(c, 'Forbidden', 403);

  const body = await c.req.json();
  const parsed = brandSchema.partial().safeParse(body);
  if (!parsed.success) return err(c, parsed.error.message, 422);

  const [updated] = await db
    .update(brands)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(brands.id, brand.id))
    .returning();
  return ok(c, updated);
});

// DELETE /brands/:id — admin only
router.delete('/:id', requireAuth, async (c) => {
  const id = c.req.param('id') as string;
  if (c.get('user').role !== 'admin') return err(c, 'Forbidden', 403);
  await db.update(brands).set({ isActive: false, updatedAt: new Date() }).where(eq(brands.id, id));
  return ok(c, { message: 'Brand deactivated' });
});

export default router;
