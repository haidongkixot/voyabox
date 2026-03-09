import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, ilike, and, count, desc, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { products, brands } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { ok, err, paginated } from '../utils/response.js';

const router = new Hono();

const productSchema = z.object({
  brandId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  trialDurationDays: z.number().int().min(1).max(365).optional(),
  spotsTotal: z.number().int().min(1).optional(),
  isFeatured: z.boolean().optional(),
});

// GET /products
router.get('/', async (c) => {
  const page = Number(c.req.query('page') ?? 1);
  const limit = Math.min(Number(c.req.query('limit') ?? 20), 100);
  const search = c.req.query('search');
  const category = c.req.query('category');
  const brandId = c.req.query('brandId');
  const featured = c.req.query('featured');
  const offset = (page - 1) * limit;

  const conditions = [eq(products.isActive, true)];
  if (search) conditions.push(or(ilike(products.name, `%${search}%`), ilike(products.description!, `%${search}%`))!);
  if (category) conditions.push(eq(products.category, category));
  if (brandId) conditions.push(eq(products.brandId, brandId));
  if (featured === 'true') conditions.push(eq(products.isFeatured, true));

  const where = and(...conditions);
  const [items, [{ total }]] = await Promise.all([
    db.query.products.findMany({
      where,
      limit,
      offset,
      orderBy: [desc(products.isFeatured), desc(products.createdAt)],
      with: { brand: { columns: { id: true, name: true, logoUrl: true } } },
    }),
    db.select({ total: count() }).from(products).where(where),
  ]);

  return paginated(c, items, Number(total), page, limit);
});

// GET /products/categories
router.get('/categories', async (c) => {
  const rows = await db
    .selectDistinct({ category: products.category })
    .from(products)
    .where(and(eq(products.isActive, true)));
  return ok(c, rows.map((r) => r.category).filter(Boolean));
});

// GET /products/:id
router.get('/:id', async (c) => {
  const id = c.req.param('id') as string;
  const product = await db.query.products.findFirst({
    where: and(eq(products.id, id), eq(products.isActive, true)),
    with: {
      brand: { columns: { id: true, name: true, logoUrl: true, description: true } },
      reviews: {
        limit: 5,
        orderBy: (r, { desc }) => [desc(r.createdAt)],
        with: { user: { columns: { id: true, name: true, avatarUrl: true } } },
      },
    },
  });
  if (!product) return err(c, 'Product not found', 404);
  return ok(c, product);
});

// POST /products — brand owner or admin
router.post('/', requireAuth, zValidator('json', productSchema), async (c) => {
  const user = c.get('user');
  const body = c.req.valid('json');

  if (user.role !== 'admin') {
    // Check brand ownership
    const brand = await db.query.brands.findFirst({ where: eq(brands.id, body.brandId) });
    if (!brand) return err(c, 'Brand not found', 404);
    if (brand.ownerId !== user.sub) return err(c, 'Forbidden', 403);
  }

  const [product] = await db
    .insert(products)
    .values({ ...body, spotsRemaining: body.spotsTotal ?? 100 })
    .returning();
  return ok(c, product, 201);
});

// PATCH /products/:id
router.patch('/:id', requireAuth, async (c) => {
  const id = c.req.param('id') as string;
  const user = c.get('user');
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: { brand: true },
  });
  if (!product) return err(c, 'Product not found', 404);

  if (user.role !== 'admin' && product.brand.ownerId !== user.sub) return err(c, 'Forbidden', 403);

  const body = await c.req.json();
  const parsed = productSchema.omit({ brandId: true }).partial().safeParse(body);
  if (!parsed.success) return err(c, parsed.error.message, 422);

  const [updated] = await db
    .update(products)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(products.id, product.id))
    .returning();
  return ok(c, updated);
});

// DELETE /products/:id — admin or brand owner
router.delete('/:id', requireAuth, async (c) => {
  const id = c.req.param('id') as string;
  const user = c.get('user');
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
    with: { brand: true },
  });
  if (!product) return err(c, 'Product not found', 404);
  if (user.role !== 'admin' && product.brand.ownerId !== user.sub) return err(c, 'Forbidden', 403);

  await db.update(products).set({ isActive: false, updatedAt: new Date() }).where(eq(products.id, product.id));
  return ok(c, { message: 'Product deactivated' });
});

export default router;
