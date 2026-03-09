import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth.js';
import { uploadImage } from '../services/upload.js';
import { ok, err } from '../utils/response.js';

const router = new Hono();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

type UploadFolder = 'avatars' | 'products' | 'reviews' | 'brands';

// POST /upload?folder=reviews
router.post('/', requireAuth, async (c) => {
  const folder = (c.req.query('folder') ?? 'reviews') as UploadFolder;
  const allowedFolders: UploadFolder[] = ['avatars', 'products', 'reviews', 'brands'];
  if (!allowedFolders.includes(folder)) return err(c, 'Invalid folder', 400);

  const formData = await c.req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return err(c, 'No file provided', 400);
  if (!ALLOWED_TYPES.includes(file.type)) return err(c, 'Only JPEG, PNG, WebP allowed', 415);
  if (file.size > MAX_SIZE_BYTES) return err(c, 'File too large (max 10 MB)', 413);

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadImage(buffer, folder);
  return ok(c, { url }, 201);
});

export default router;
