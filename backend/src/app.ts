import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { HTTPException } from 'hono/http-exception';

import authRouter from './routes/auth.js';
import brandsRouter from './routes/brands.js';
import productsRouter from './routes/products.js';
import trialsRouter from './routes/trials.js';
import reviewsRouter from './routes/reviews.js';
import rewardsRouter from './routes/rewards.js';
import uploadRouter from './routes/upload.js';
import adminRouter from './routes/admin.js';

const app = new Hono();

// ─── Global Middleware ────────────────────────────────────────────────────────

app.use('*', logger());
app.use('*', secureHeaders());
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }),
);
app.use('*', prettyJSON());

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/', (c) => c.json({ status: 'ok', service: 'Voyabox API', version: '1.0.0' }));
app.get('/health', (c) => c.json({ status: 'healthy', timestamp: new Date().toISOString() }));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.route('/api/auth', authRouter);
app.route('/api/brands', brandsRouter);
app.route('/api/products', productsRouter);
app.route('/api/trials', trialsRouter);
app.route('/api/reviews', reviewsRouter);
app.route('/api/rewards', rewardsRouter);
app.route('/api/upload', uploadRouter);
app.route('/api/admin', adminRouter);

// ─── Error Handling ───────────────────────────────────────────────────────────

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json({ success: false, error: error.message }, error.status);
  }
  console.error('[Error]', error);
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

app.notFound((c) => c.json({ success: false, error: 'Route not found' }, 404));

export default app;
