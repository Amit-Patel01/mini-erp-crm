import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Prisma database seeding...');

  // 1. Clean existing records
  try {
    await prisma.challanItem.deleteMany();
    await prisma.challan.deleteMany();
    await prisma.stockMovement.deleteMany();
    await prisma.product.deleteMany();
    await prisma.followUp.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.user.deleteMany();
  } catch (e) {
    console.log('Initializing database tables for the first time...');
  }

  // 2. Create ONLY System Admin User
  const adminPassword = await bcrypt.hash('Admin@123', 10);

  await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  console.log('Created System Admin User (admin@example.com / Admin@123)');
  console.log('Seeding successfully finished.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
