import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { OrderService } from '@/lib/services/orderService';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, getAuthOptions(req, res));
    const token = req.headers.authorization?.split(' ')[1]; // Expecting "Bearer <API_KEY>"

    // Helper to check if request is from a trusted external system (e.g., Payment Gateway Webhook)
    // You should define a webhook secret in your .env file: WEBHOOK_API_KEY=your_secure_random_string
    const isVerifiedWebhook = token && token === process.env.WEBHOOK_API_KEY;

    if (req.method === 'GET') {
      // GET /api/orders - Fetch all orders
      // Security: Only ADMINS can list all orders. Users can only see their own (via my-orders.tsx usually, not here directly ideally, 
      // but if we support it, we must filter).

      if (!session) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      if (session.user.role !== 'ADMIN') {
        // If not admin, force filter by their email
        const { email } = req.query;
        if (email && email !== session.user.email) {
          return res.status(403).json({ success: false, error: 'Forbidden: Cannot access other users orders' });
        }
        // If no email param provided, default to their own
        req.query.email = session.user.email;
      }

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
      // POST /api/orders - Create a new order

      // Security: 
      // 1. If it's a "Webhook" (external system), it must provide the correct API Key.
      // 2. If it's a User (checkout), they must be logged in (unless we allow Guest Checkout).
      //    But usually, checkout.tsx calls createOrder via OrderService directly or a specific checkout endpoint.
      //    This specific endpoint seems to be a generic "Create Order" which is risky.

      // Strict check: Must be ADMIN or Verified Webhook to create arbitrary orders via API.
      // Normal users should go through the specific /api/checkout flow which handles payment validation.

      const isAdmin = session?.user?.role === 'ADMIN';

      if (!isAdmin && !isVerifiedWebhook) {
        return res.status(403).json({ success: false, error: 'Forbidden: Only Admins or Webhooks can create orders directly.' });
      }

      const { customer, email, total, status, orderItems } = req.body;

      // Validation
      if (!email || !total || !orderItems || !Array.isArray(orderItems)) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: email, total, orderItems',
        });
      }

      // Create order with order items
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
