import type { Context, Next } from 'hono';
import { verifyAccessToken, type JwtPayload } from '../utils/jwt.js';
import { err } from '../utils/response.js';

declare module 'hono' {
  interface ContextVariableMap {
    user: JwtPayload;
  }
}

export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return err(c, 'Missing or invalid Authorization header', 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verifyAccessToken(token);
    c.set('user', payload);
    await next();
  } catch {
    return err(c, 'Invalid or expired token', 401);
  }
}

export async function requireRole(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    if (!user) return err(c, 'Unauthorized', 401);
    if (!roles.includes(user.role)) return err(c, 'Forbidden', 403);
    await next();
  };
}

export const requireAdmin = requireRole('admin');
export const requireBrandOrAdmin = requireRole('brand', 'admin');
