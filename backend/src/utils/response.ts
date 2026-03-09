import type { Context } from 'hono';

export function ok<T>(c: Context, data: T, status: 200 | 201 = 200) {
  return c.json({ success: true, data }, status);
}

export function err(c: Context, message: string, status: 400 | 401 | 403 | 404 | 409 | 413 | 415 | 422 | 500 = 400) {
  return c.json({ success: false, error: message }, status);
}

export function paginated<T>(
  c: Context,
  items: T[],
  total: number,
  page: number,
  limit: number,
) {
  return c.json({
    success: true,
    data: items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
