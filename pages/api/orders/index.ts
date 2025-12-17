import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { OrderService } from '@/lib/services/orderService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      // GET /api/orders - Fetch all orders
      const { status, email } = req.query;

      const orders = await OrderService.getOrders({
        status: status as string,
        email: email as string,
      });

      return res.status(200).json({
        success: true,
        data: orders,
      });
    } else if (req.method === 'POST') {
      // POST /api/orders - Create a new order (used by webhook)
      const { customer, email, total, status, orderItems } = req.body;

      // Validation
      if (!email || !total || !orderItems || !Array.isArray(orderItems)) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: email, total, orderItems',
        });
      }

      // Create order with order items
      // Note: This is a simplified creation for webhooks, not using the manual order service
      // which includes stock checks (assuming webhooks come from a source that already checked stock or doesn't need to)
      const order = await prisma.order.create({
        data: {
          customer: customer || 'Guest',
          email,
          total: parseFloat(total),
          status: status || 'PENDING',
          orderItems: {
            create: orderItems.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              selectedOptions: item.selectedOptions || null,
            })),
          },
        },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      });

      return res.status(201).json({
        success: true,
        data: order,
      });
    } else {
      // Method not allowed
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({
        success: false,
        error: `Method ${req.method} Not Allowed`,
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
