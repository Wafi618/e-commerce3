const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log('🗑️  Clearing database...');

    // Delete all data in order (respecting foreign key constraints)
    await prisma.orderItem.deleteMany({});
    console.log('✓ Deleted all order items');

    await prisma.order.deleteMany({});
    console.log('✓ Deleted all orders');

    await prisma.cartItem.deleteMany({});
    console.log('✓ Deleted all cart items');

    await prisma.product.deleteMany({});
    console.log('✓ Deleted all products');

    await prisma.user.deleteMany({});
    console.log('✓ Deleted all users');

    console.log('\n👤 Creating admin user...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('2025@wafiadmin', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'putitinwafi@gmail.com',
        password: hashedPassword,
        name: 'Admin',
        role: 'ADMIN',
      },
    });

    console.log('✓ Created admin user: putitinwafi@gmail.com');
    console.log('  Password: 2025@wafiadmin');

    console.log('\n✅ Database reset complete!');
    console.log('\nYou can now login with:');
    console.log('  Email: putitinwafi@gmail.com');
    console.log('  Password: 2025@wafiadmin');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
