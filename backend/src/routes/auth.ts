import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, refreshTokens } from '../db/schema.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { ok, err } from '../utils/response.js';
import { requireAuth } from '../middleware/auth.js';
import { getLevel } from '../utils/tokens.js';

const router = new Hono();

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /auth/register
router.post('/register', zValidator('json', registerSchema), async (c) => {
  const body = c.req.valid('json');

  const existing = await db.query.users.findFirst({
    where: eq(users.email, body.email),
  });
  if (existing) return err(c, 'Email already registered', 409);

  const passwordHash = await hashPassword(body.password);
  const [user] = await db
    .insert(users)
    .values({ name: body.name, email: body.email, passwordHash, phone: body.phone })
    .returning();

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({ sub: user.id, role: user.role, email: user.email }),
    signRefreshToken(user.id),
  ]);

  const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(refreshTokens).values({ userId: user.id, token: refreshToken, expiresAt: refreshExpiry });

  const { passwordHash: _, ...safeUser } = user;
  return ok(c, { user: { ...safeUser, ...getLevel(user.totalEarned) }, accessToken, refreshToken }, 201);
});

// POST /auth/login
router.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user || !user.isActive) return err(c, 'Invalid credentials', 401);

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) return err(c, 'Invalid credentials', 401);

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken({ sub: user.id, role: user.role, email: user.email }),
    signRefreshToken(user.id),
  ]);

  const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(refreshTokens).values({ userId: user.id, token: refreshToken, expiresAt: refreshExpiry });

  const { passwordHash: _, ...safeUser } = user;
  return ok(c, { user: { ...safeUser, ...getLevel(user.totalEarned) }, accessToken, refreshToken });
});

// POST /auth/refresh
router.post('/refresh', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const token = body?.refreshToken as string;
  if (!token) return err(c, 'Refresh token required', 400);

  const stored = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.token, token),
  });
  if (!stored || stored.expiresAt < new Date()) {
    return err(c, 'Invalid or expired refresh token', 401);
  }

  let userId: string;
  try {
    userId = await verifyRefreshToken(token);
  } catch {
    return err(c, 'Invalid refresh token', 401);
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user || !user.isActive) return err(c, 'User not found', 401);

  // Rotate refresh token
  await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
  const [newAccessToken, newRefreshToken] = await Promise.all([
    signAccessToken({ sub: user.id, role: user.role, email: user.email }),
    signRefreshToken(user.id),
  ]);
  const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(refreshTokens).values({ userId: user.id, token: newRefreshToken, expiresAt: refreshExpiry });

  return ok(c, { accessToken: newAccessToken, refreshToken: newRefreshToken });
});

// POST /auth/logout
router.post('/logout', requireAuth, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  if (body?.refreshToken) {
    await db.delete(refreshTokens).where(eq(refreshTokens.token, body.refreshToken));
  }
  return ok(c, { message: 'Logged out' });
});

// GET /auth/me
router.get('/me', requireAuth, async (c) => {
  const { sub } = c.get('user');
  const user = await db.query.users.findFirst({ where: eq(users.id, sub) });
  if (!user) return err(c, 'User not found', 404);
  const { passwordHash: _, ...safeUser } = user;
  return ok(c, { ...safeUser, ...getLevel(user.totalEarned) });
});

// PATCH /auth/me
router.patch(
  '/me',
  requireAuth,
  zValidator(
    'json',
    z.object({
      name: z.string().min(2).max(100).optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      avatarUrl: z.string().url().optional(),
    }),
  ),
  async (c) => {
    const { sub } = c.get('user');
    const body = c.req.valid('json');
    const [updated] = await db
      .update(users)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(users.id, sub))
      .returning();
    const { passwordHash: _, ...safeUser } = updated;
    return ok(c, { ...safeUser, ...getLevel(updated.totalEarned) });
  },
);

// POST /auth/change-password
router.post(
  '/change-password',
  requireAuth,
  zValidator('json', z.object({ currentPassword: z.string(), newPassword: z.string().min(8) })),
  async (c) => {
    const { sub } = c.get('user');
    const { currentPassword, newPassword } = c.req.valid('json');
    const user = await db.query.users.findFirst({ where: eq(users.id, sub) });
    if (!user) return err(c, 'User not found', 404);
    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) return err(c, 'Current password is incorrect', 400);
    const passwordHash = await hashPassword(newPassword);
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, sub));
    return ok(c, { message: 'Password changed' });
  },
);

export default router;
