
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.product.count({ where: { isArchived: false } });
    console.log('Product Count:', count);

    const products = await prisma.product.findMany({
        where: { isArchived: false },
        take: 5,
        select: { id: true, updatedAt: true }
    });
    console.log('Sample Products:', products);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
