import 'dotenv/config';
import { serve } from '@hono/node-server';
import app from './app.js';

const PORT = Number(process.env.PORT ?? 3000);

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`🚀 Voyabox API running on http://localhost:${PORT}`);
  console.log(`   ENV: ${process.env.NODE_ENV ?? 'development'}`);
});
