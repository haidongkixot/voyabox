import { handle } from 'hono/vercel';
import app from '../src/app.js';

// Node.js 20 serverless runtime (supports pg, bcrypt, etc.)
export const config = {
  runtime: 'nodejs20.x',
  maxDuration: 30,
};

export default handle(app);
