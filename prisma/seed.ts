import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create CEO admin accounts with password 710101 (from contact page)
  const ceoPassword = await bcrypt.hash('710101', 10);

  const ceo1 = await prisma.user.upsert({
    where: { email: 'infostaraccess@gmail.com' },
    update: {
      password: ceoPassword,
    },
    create: {
      email: 'infostaraccess@gmail.com',
      password: ceoPassword,
      name: 'A.K.M Robiul Hassan',
      role: 'ADMIN',
    },
  });
  console.log('✓ CEO admin account created:', ceo1.email);

  const ceo2 = await prisma.user.upsert({
    where: { email: 'akmrobiul2024@gmail.com' },
    update: {
      password: ceoPassword,
    },
    create: {
      email: 'akmrobiul2024@gmail.com',
      password: ceoPassword,
      name: 'A.K.M Robiul Hassan',
      role: 'ADMIN',
    },
  });
  console.log('✓ CEO admin account (alternate email) created:', ceo2.email);

  // Create additional admin account
  const wafiPassword = await bcrypt.hash('2025@wafiadmin', 10);
  const wafiAdmin = await prisma.user.upsert({
    where: { email: 'putitinwafi@gmail.com' },
    update: {
      password: wafiPassword,
    },
    create: {
      email: 'putitinwafi@gmail.com',
      password: wafiPassword,
      name: 'Wafi Admin',
      role: 'ADMIN',
    },
  });
  console.log('✓ Wafi admin account created:', wafiAdmin.email);

  console.log('\n🎉 Database seeding completed successfully!\n');
  console.log('CEO Admin credentials:');
  console.log('  Email: infostaraccess@gmail.com');
  console.log('  Email (alt): akmrobiul2024@gmail.com');
  console.log('  Password: 710101\n');
  console.log('Wafi Admin credentials:');
  console.log('  Email: putitinwafi@gmail.com');
  console.log('  Password: 2025@wafiadmin\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
