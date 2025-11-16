import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Seed Operator Prefixes (Syriatel & MTN)
  console.log('📞 Creating operator prefixes...');
  await prisma.operatorPrefix.createMany({
    data: [
      // Syriatel prefixes
      { operator_code: 'SYRIATEL', prefix: '093', is_active: true },
      { operator_code: 'SYRIATEL', prefix: '098', is_active: true },
      { operator_code: 'SYRIATEL', prefix: '099', is_active: true },
      // MTN prefixes
      { operator_code: 'MTN', prefix: '094', is_active: true },
      { operator_code: 'MTN', prefix: '095', is_active: true },
      { operator_code: 'MTN', prefix: '096', is_active: true },
    ],
    skipDuplicates: true,
  });

  // 2. Seed Operator Message Rules
  console.log('📋 Creating operator message rules...');
  await prisma.operatorMessageRule.createMany({
    data: [
      {
        operator_code: 'SYRIATEL',
        pattern: 'تم|نجاح|بنجاح|successful',
        result_status: 'success',
      },
      {
        operator_code: 'SYRIATEL',
        pattern: 'فشل|خطأ|غير كاف|insufficient|failed|error',
        result_status: 'failed',
      },
      {
        operator_code: 'MTN',
        pattern: 'تم|نجاح|successful|completed',
        result_status: 'success',
      },
      {
        operator_code: 'MTN',
        pattern: 'فشل|failed|insufficient|error|خطأ',
        result_status: 'failed',
      },
    ],
    skipDuplicates: true,
  });

  // 3. Create Admin User
  console.log('👤 Creating admin user...');
  const admin = await prisma.user.upsert({
    where: { phone: '0935798344' },
    update: {},
    create: {
      phone: '0935798344',
      name: 'System Admin',
      role: 'ADMIN',
      status: 'active',
      telegram_user_id: 258304206,
    },
  });

  // 4. Create Test User
  console.log('👤 Creating test user...');
  const testUser = await prisma.user.upsert({
    where: { phone: '0949876543' },
    update: {},
    create: {
      phone: '0949876543',
      name: 'Test User',
      role: 'USER',
      status: 'active',
      telegram_user_id: 987654321,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`   - Created ${admin.name} (Admin): ${admin.phone}`);
  console.log(`   - Created ${testUser.name} (User): ${testUser.phone}`);
  console.log(`   - Created 6 operator prefixes (Syriatel: 093, 098, 099 | MTN: 094, 095, 096)`);
  console.log(`   - Created 4 operator message rules`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
