import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

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

  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
  }

  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
      });
    }

    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required',
      });
    }

    // Check if customer exists
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: {
        role: true,
        orders: {
          select: { status: true }
        }
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
      });
    }

    // Ensure target user is a customer
    if (customer.role !== 'CUSTOMER') {
      return res.status(400).json({
        success: false,
        error: 'Can only delete customer accounts',
      });
    }

    // Check if customer has any active orders (pending, processing, or shipping)
    const hasActiveOrders = customer.orders.some(
      order => order.status === 'PENDING' ||
        order.status === 'PROCESSING' ||
        order.status === 'SHIPPING'
    );

    if (hasActiveOrders) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete customer with pending, processing, or shipping orders',
      });
    }

    // Delete the customer (related records will be cascade deleted)
    await prisma.user.delete({
      where: { id: customerId },
    });

    return res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    console.error('Delete Customer Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete customer',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
