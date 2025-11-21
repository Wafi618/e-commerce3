import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/serverAuth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed`,
    });
  }

  const user = await requireAdmin(req, res);
  if (!user) return;

  try {
    // Check if user is admin (Already checked by requireAdmin, but let's keep logic minimal)
    // We can remove the DB check since requireAdmin checks the session/token role.
    // However, checking DB is safer if role was revoked. 
    // But the original code checked role from DB using the ID from token.
    
    // Let's stick to the pattern:
    
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required',
      });
    }

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }

    // Only allow deletion if status is COMPLETED or CANCELLED
    if (order.status !== 'COMPLETED' && order.status !== 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: 'Only completed or cancelled orders can be deleted',
      });
    }

    // Delete the order (OrderItems will be cascade deleted)
    await prisma.order.delete({
      where: { id: orderId },
    });

    return res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    console.error('Delete Order Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete order',
      message: error instanceof Error ? error.message : 'Unknown error',
    });  }
}
