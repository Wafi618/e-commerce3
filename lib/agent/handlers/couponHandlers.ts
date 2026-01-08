import { prisma } from '@/lib/prisma';

export const handleListCoupons = async (args: any) => {
    const where: any = {};
    if (args?.search) {
        where.code = { contains: args.search.toUpperCase(), mode: 'insensitive' };
    }
    if (args?.activeOnly) {
        where.isActive = true;
    }

    const coupLimit = (args?.limit as number) || 20;
    const coupPage = (args?.page as number) || 1;
    const coupSkip = (coupPage - 1) * coupLimit;

    const [coupTotal, coupons] = await Promise.all([
        prisma.coupon.count({ where }),
        prisma.coupon.findMany({
            where,
            take: coupLimit,
            skip: coupSkip,
            orderBy: { createdAt: 'desc' },
        })
    ]);

    return {
        success: true,
        coupons,
        pagination: {
            totalItems: coupTotal,
            totalPages: Math.ceil(coupTotal / coupLimit),
            currentPage: coupPage,
            itemsPerPage: coupLimit
        }
    };
};

export const handleCreateCoupon = async (args: any) => {
    const { code, discountType, discountValue, minOrderAmount, expiresInDays } = args;

    let expiresAt = null;
    if (expiresInDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const coupon = await prisma.coupon.create({
        data: {
            code: code.toUpperCase(),
            type: discountType, // Mapped from input discountType to schema type
            value: discountValue, // Mapped from input discountValue to schema value
            minOrderAmount: minOrderAmount || 0,
            expiresAt
        }
    });

    return { success: true, coupon };
};

export const handleUpdateCoupon = async (args: any) => {
    const { id, code, ...updates } = args;
    const where = id ? { id } : { code: code?.toUpperCase() };

    if (updates.expiresInDays) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + updates.expiresInDays);
        updates.expiresAt = expiresAt;
        delete updates.expiresInDays;
    }

    const coupon = await prisma.coupon.update({
        where,
        data: updates
    });
    return { success: true, coupon };
};

export const handleDeleteCoupon = async (args: any) => {
    const { id, code } = args;
    const where = id ? { id } : { code: code?.toUpperCase() };
    await prisma.coupon.delete({ where });
    return { success: true, message: "Coupon deleted." };
};
