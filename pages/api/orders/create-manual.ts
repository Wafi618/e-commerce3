import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
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
      bkashNumber, // New manual field
      trxId, // New manual field
    } = req.body;

    // CRITICAL: Validate stock availability
    for (const item of cartItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.id },
        select: { stock: true, name: true },
      });

      if (!product) {
        return res
          .status(400)
          .json({
            success: false,
            error: `Product "${item.name}" not found`,
          });
      }

      if (product.stock < item.quantity) {
        return res
          .status(400)
          .json({
            success: false,
            error: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`,
          });
      }
    }

    // Reserve stock immediately by decrementing it
    const stockReservations: Array<{
      productId: number;
      reservedQty: number;
      previousStock: number;
    }> = [];

    for (const item of cartItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.id },
        select: { stock: true },
      });

      if (!product || product.stock < item.quantity) {
        // Rollback all previous reservations
        for (const reservation of stockReservations) {
          await prisma.product.update({
            where: { id: reservation.productId },
            data: { stock: reservation.previousStock },
          });
        }

        return res
          .status(400)
          .json({
            success: false,
            error: `Stock changed during checkout. Please try again.`,
          });
      }

      // Decrement stock to reserve it
      await prisma.product.update({
        where: { id: item.id },
        data: { stock: { decrement: item.quantity } },
      });

      stockReservations.push({
        productId: item.id,
        reservedQty: item.quantity,
        previousStock: product.stock,
      });
    }

    // Create a PENDING order with the manual payment details
    const order = await prisma.order.create({
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
        total: amount,
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

    // After order is created, clear the user's cart if they are logged in
    if (userId) {
      await prisma.cartItem.deleteMany({
        where: {
          userId: userId,
        },
      });
    }

    return res.status(200).json({
      success: true,
      orderId: order.id,
      message: 'Order placed successfully. Awaiting manual verification.',
    });
  } catch (error) {
    console.error('Manual order creation error:', error);
    return res.status(500).json({ success: false, error: 'Something went wrong' });
  } finally {
    await prisma.$disconnect();
  }
}