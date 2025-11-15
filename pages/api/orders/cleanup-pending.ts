import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * Cleanup abandoned PENDING orders and restore stock
 * This endpoint should be called periodically (e.g., via cron job)
 * or when a user cancels payment
 *
 * PENDING orders older than 30 minutes are considered abandoned
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Find all PENDING orders older than 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const abandonedOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: thirtyMinutesAgo
        }
      },
      include: {
        orderItems: true
      }
    });

    let cleanedCount = 0;

    for (const order of abandonedOrders) {
      // Restore stock for each item
      for (const item of order.orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }
        });
      }

      // Mark order as CANCELLED
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' }
      });

      cleanedCount++;
    }

    return res.status(200).json({
      success: true,
      message: `Cleaned up ${cleanedCount} abandoned orders`,
      count: cleanedCount
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cleanup abandoned orders'
    });
  } finally {
    await prisma.$disconnect();
  }
}
