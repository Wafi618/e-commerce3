import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { manualCheckoutSchema } from '@/lib/schemas';
import { sendDiscordNotification } from '@/utils/discord';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const result = manualCheckoutSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error.issues.map(e => e.message).join(', '),
      });
    }

    const {
      amount,
      cartItems,
      customerEmail,
      customerName,
      userId,
      phone,
      city,
      country,
      address,
      house,
      floor,
      notes,
      bkashNumber,
      trxId,
    } = result.data;

    // Use interactive transaction to ensure stock safety
    const orderId = await prisma.$transaction(async (tx) => {
      // 1. Validate and Reserve Stock
      for (const item of cartItems) {
        const product = await tx.product.findUnique({
          where: { id: item.id },
          select: { stock: true, name: true },
        });

        if (!product) {
          throw new Error(`Product "${item.name}" not found`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`);
        }

        // Decrement stock
        await tx.product.update({
          where: { id: item.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 2. Create Order
      const order = await tx.order.create({
        data: {
          // Conditionally connect the user if a userId exists
          ...(userId && {
            user: {
              connect: {
                id: userId,
              },
            },
          }),
          customer: customerName,
          email: customerEmail,
          phone: phone || null,
          city: city || null,
          country: country || null,
          address: address || null,
          house: house || null,
          floor: floor || null,
          notes: notes || null,
          total: new (require('decimal.js'))(amount as any),
          status: 'PENDING', // Admin must verify this manually
          paymentMethod: 'MANUAL_BKASH',
          paymentPhoneNumber: bkashNumber,
          paymentTrxId: trxId,
          orderItems: {
            create: cartItems.map((item: any) => ({
              productId: item.id,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });

      // 3. Clear Cart (if user logged in)
      if (userId) {
        await tx.cartItem.deleteMany({
          where: {
            userId: userId,
          },
        });
      }

      return order.id;
    });

    // Send Discord Notification for Manual Order
    const notificationItems = cartItems.map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price
    }));

    await sendDiscordNotification({
      id: orderId, // This is returned from the transaction
      customer: customerName,
      phone: phone,
      total: amount,
      address: address,
      city: city,
      paymentMethod: 'MANUAL_BKASH'
    }, notificationItems);

    return res.status(200).json({
      success: true,
      orderId: orderId,
      message: 'Order placed successfully. Awaiting manual verification.',
    });
  } catch (error) {
    console.error('Manual order creation error:', error);
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Something went wrong'
    });
  } finally {
    await prisma.$disconnect();
  }
}
