# Voyabox Backend API

REST API for the Voyabox product trial platform.

## Stack
- **Runtime**: Node.js 22
- **Framework**: Hono v4
- **ORM**: Drizzle ORM + PostgreSQL
- **Auth**: JWT (access 15m + refresh 7d)
- **Images**: Cloudinary
- **Validation**: Zod

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill environment variables
cp .env.example .env
# Edit .env → set DATABASE_URL to your PostgreSQL connection string

# 3. Run migrations (migration files are already generated)
npm run db:migrate

# 4. Seed initial data (admin + sample brands/products)
npx tsx src/db/seed.ts

# 5. Start development server
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Access token secret (≥32 chars) |
| `JWT_REFRESH_SECRET` | Refresh token secret (≥32 chars) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `PORT` | Server port (default 3000) |
| `ADMIN_EMAIL` | Seed admin email |
| `ADMIN_PASSWORD` | Seed admin password |

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/refresh` | — | Refresh access token |
| POST | `/api/auth/logout` | ✓ | Logout (invalidate refresh token) |
| GET | `/api/auth/me` | ✓ | Get current user profile |
| PATCH | `/api/auth/me` | ✓ | Update profile |
| POST | `/api/auth/change-password` | ✓ | Change password |

### Brands
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/brands` | — | List brands (search, page, limit) |
| GET | `/api/brands/:id` | — | Brand detail + products |
| POST | `/api/brands` | Admin | Create brand |
| PATCH | `/api/brands/:id` | Admin/Owner | Update brand |
| DELETE | `/api/brands/:id` | Admin | Deactivate brand |

### Products
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/products` | — | List (search, category, brandId, featured) |
| GET | `/api/products/categories` | — | Distinct categories |
| GET | `/api/products/:id` | — | Product detail + reviews |
| POST | `/api/products` | Admin/Brand | Create product |
| PATCH | `/api/products/:id` | Admin/Brand | Update product |
| DELETE | `/api/products/:id` | Admin/Brand | Deactivate product |

### Trials
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/trials` | ✓ | Register for trial (+25 tokens) |
| GET | `/api/trials/my` | ✓ | My trials (status filter) |
| GET | `/api/trials/:id` | ✓ | Trial detail |

### Reviews
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/reviews` | ✓ | Submit review (+75/+25/+50 tokens) |
| GET | `/api/reviews/my` | ✓ | My reviews |
| GET | `/api/reviews/product/:productId` | — | Product reviews (public) |
| GET | `/api/reviews/:id` | — | Review detail |

### Rewards
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/rewards/balance` | ✓ | Token balance + level info |
| GET | `/api/rewards/history` | ✓ | Transaction history |

### Upload
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/upload?folder=reviews` | ✓ | Upload image (multipart/form-data) |

### Admin
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | Admin | Dashboard stats |
| GET | `/api/admin/users` | Admin | List users |
| GET | `/api/admin/users/:id` | Admin | User detail + activity |
| PATCH | `/api/admin/users/:id` | Admin | Update user role/status/balance |
| GET | `/api/admin/trials` | Admin | All trials (status filter) |
| PATCH | `/api/admin/trials/:id/status` | Admin | Approve/ship/complete/reject trial |
| GET | `/api/admin/reviews` | Admin | All reviews |
| PATCH | `/api/admin/brands/:id/assign-owner` | Admin | Assign brand owner |
| GET | `/api/admin/analytics` | Admin | Analytics (from/to date range) |

## Token Rules
| Action | Tokens |
|---|---|
| Register trial | +25 |
| Write review | +75 |
| Upload photo | +25 |
| First review (per product) | +50 bonus |

## Deployment (Vercel)

### 1. Set up a PostgreSQL database
Use **Neon** (free, serverless-native) at https://neon.tech — create a project and copy the connection string.
Or use **Vercel Postgres** (Storage tab in Vercel dashboard) — connection string is auto-injected as `POSTGRES_URL`.

### 2. Run migrations locally (one-time)
```bash
# Create .env file (works on Windows, Mac, Linux)
cp .env.example .env
# Then edit .env and set DATABASE_URL=your_neon_connection_string

npm run db:migrate
npx tsx src/db/seed.ts
```

### 3. Deploy to Vercel
```bash
npm i -g vercel
vercel login
cd backend/
vercel --prod
```
Or connect the GitHub repo in the Vercel dashboard:
- **Root directory**: `backend`
- **Build command**: `npm run build`
- **Output directory**: (leave blank — Vercel handles `api/` automatically)

### 4. Add environment variables in Vercel dashboard
Copy all variables from `.env.example` into Vercel → Settings → Environment Variables.
