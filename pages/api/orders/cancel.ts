import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/serverAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed`,
    });
  }

  const user = await requireUser(req, res);
  if (!user) return;

  const userId = user.userId;

  try {
    const { orderId } = req.body;

    // Verify order belongs to user and can be cancelled
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Can only cancel if not shipped or completed
    if (order.status === 'SHIPPING' || order.status === 'COMPLETED' || order.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: 'Order cannot be cancelled at this stage',
      });
    }

    // Get order items to restore stock
    const orderWithItems = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
      },
    });

    // Update order status to cancelled
    const cancelledOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });

    // Restore stock for cancelled order
    if (orderWithItems?.orderItems) {
      for (const item of orderWithItems.orderItems) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: cancelledOrder,
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel Order Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel order',
      message: error instanceof Error ? error.message : 'Unknown error',
    });  }
}
