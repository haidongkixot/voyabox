/**
 * Seed script: creates the admin user and sample brands/products.
 * Run once: tsx src/db/seed.ts
 */
import 'dotenv/config';
import { db } from './index.js';
import { users, brands, products } from './schema.js';
import { hashPassword } from '../utils/hash.js';

async function seed() {
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    console.error('ERROR: DATABASE_URL is not set. Create a .env file first.');
    process.exit(1);
  }
  console.log('Seeding database…');

  // Admin user
  const [admin] = await db
    .insert(users)
    .values({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL ?? 'admin@voyabox.com',
      passwordHash: await hashPassword(process.env.ADMIN_PASSWORD ?? 'Admin@123456'),
      role: 'admin',
    })
    .onConflictDoNothing()
    .returning();

  console.log('Admin:', admin?.email ?? 'already exists');

  // Sample brands
  const sampleBrands = await db
    .insert(brands)
    .values([
      { name: 'Vinamilk', description: 'Hàng đầu ngành sữa Việt Nam', category: 'Thực phẩm & Đồ uống' },
      { name: 'L\'Oréal', description: 'Làm đẹp cho mọi người', category: 'Làm đẹp & Chăm sóc cá nhân' },
      { name: 'Samsung', description: 'Đổi mới từng ngày', category: 'Điện tử' },
      { name: 'Unilever', description: 'Sản phẩm tiêu dùng hàng ngày', category: 'Gia đình & Vệ sinh' },
      { name: 'Nestlé', description: 'Good Food, Good Life', category: 'Thực phẩm & Đồ uống' },
      { name: 'Dove', description: 'Real beauty, real care', category: 'Làm đẹp & Chăm sóc cá nhân' },
    ])
    .onConflictDoNothing()
    .returning();

  console.log(`Brands: ${sampleBrands.length} created`);

  if (sampleBrands.length > 0) {
    const [vinamilk, loreal, samsung, unilever, nestle, dove] = sampleBrands;

    await db
      .insert(products)
      .values([
        {
          brandId: vinamilk.id,
          name: 'Sữa tươi tiệt trùng Vinamilk 100% ít đường 1L',
          description: 'Sữa tươi tiệt trùng nguyên chất từ những con bò khỏe mạnh nhất Việt Nam.',
          category: 'Thực phẩm & Đồ uống',
          tags: ['sữa', 'healthy', 'ít đường'],
          spotsTotal: 200,
          spotsRemaining: 200,
          trialDurationDays: 7,
          isFeatured: true,
        },
        {
          brandId: loreal.id,
          name: 'L\'Oréal Paris Elvive Extraordinary Oil Serum 100ml',
          description: 'Serum dưỡng tóc cao cấp với 6 loại dầu quý hiếm.',
          category: 'Làm đẹp & Chăm sóc cá nhân',
          tags: ['tóc', 'serum', 'dưỡng'],
          spotsTotal: 150,
          spotsRemaining: 150,
          trialDurationDays: 14,
          isFeatured: true,
        },
        {
          brandId: samsung.id,
          name: 'Samsung Galaxy Buds FE - True Wireless',
          description: 'Tai nghe không dây với Active Noise Cancellation.',
          category: 'Điện tử',
          tags: ['tai nghe', 'ANC', 'wireless'],
          spotsTotal: 50,
          spotsRemaining: 50,
          trialDurationDays: 30,
          isFeatured: true,
        },
        {
          brandId: unilever.id,
          name: 'Comfort Tinh chất Hương ban mai 800ml',
          description: 'Nước xả vải Comfort với công thức tinh chất hoa.',
          category: 'Gia đình & Vệ sinh',
          tags: ['nước xả', 'hương thơm', 'mềm mại'],
          spotsTotal: 300,
          spotsRemaining: 300,
          trialDurationDays: 14,
        },
        {
          brandId: nestle.id,
          name: 'Nestlé MILO Thức uống Lúa mạch 180ml x6',
          description: 'Năng lượng cho ngày mới với MILO - giàu Protomalt.',
          category: 'Thực phẩm & Đồ uống',
          tags: ['năng lượng', 'milo', 'lúa mạch'],
          spotsTotal: 500,
          spotsRemaining: 500,
          trialDurationDays: 7,
        },
        {
          brandId: dove.id,
          name: 'Dove Sữa tắm dưỡng ẩm Deeply Nourishing 530g',
          description: 'Sữa tắm Dove với 1/4 kem dưỡng ẩm chăm sóc da mềm mịn.',
          category: 'Làm đẹp & Chăm sóc cá nhân',
          tags: ['sữa tắm', 'dưỡng ẩm', 'chăm sóc da'],
          spotsTotal: 200,
          spotsRemaining: 200,
          trialDurationDays: 14,
        },
        {
          brandId: loreal.id,
          name: 'L\'Oréal Paris True Match Foundation SPF17 30ml',
          description: 'Kem nền mịn màng với SPF17, 30+ tông màu.',
          category: 'Làm đẹp & Chăm sóc cá nhân',
          tags: ['kem nền', 'SPF', 'trang điểm'],
          spotsTotal: 100,
          spotsRemaining: 100,
          trialDurationDays: 21,
        },
        {
          brandId: vinamilk.id,
          name: 'Vinamilk Sữa chua uống Probi Dâu 130ml x4',
          description: 'Sữa chua uống lên men tự nhiên bổ sung men vi sinh.',
          category: 'Thực phẩm & Đồ uống',
          tags: ['sữa chua', 'probiotic', 'dâu'],
          spotsTotal: 400,
          spotsRemaining: 400,
          trialDurationDays: 7,
        },
      ])
      .onConflictDoNothing();

    console.log('Products seeded');
  }

  console.log('Seed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
