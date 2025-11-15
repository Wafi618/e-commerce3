import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

const BKASH_USERNAME = process.env.BKASH_USERNAME || '';
const BKASH_PASSWORD = process.env.BKASH_PASSWORD || '';
const BKASH_APP_KEY = process.env.BKASH_APP_KEY || '';
const BKASH_APP_SECRET = process.env.BKASH_APP_SECRET || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      notes
    } = req.body;

    // CRITICAL: Validate stock availability for ALL items BEFORE creating order
    // This prevents race conditions where multiple users buy the same last item
    for (const item of cartItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.id },
        select: { stock: true, name: true }
      });

      if (!product) {
        return res.status(400).json({
          success: false,
          error: `Product "${item.name}" not found`
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`
        });
      }
    }

    // Reserve stock immediately by decrementing it
    // This prevents other users from ordering the same items
    const stockReservations: Array<{ productId: number, reservedQty: number, previousStock: number }> = [];

    for (const item of cartItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.id },
        select: { stock: true }
      });

      if (!product || product.stock < item.quantity) {
        // Rollback all previous reservations
        for (const reservation of stockReservations) {
          await prisma.product.update({
            where: { id: reservation.productId },
            data: { stock: reservation.previousStock }
          });
        }

        return res.status(400).json({
          success: false,
          error: `Stock changed during checkout. Please try again.`
        });
      }

      // Decrement stock to reserve it
      await prisma.product.update({
        where: { id: item.id },
        data: { stock: { decrement: item.quantity } }
      });

      stockReservations.push({
        productId: item.id,
        reservedQty: item.quantity,
        previousStock: product.stock
      });
    }

    // Create a PENDING order in the database
    // Stock is already reserved at this point
    const order = await prisma.order.create({
      data: {
        userId: userId || null,
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
        status: 'PENDING',
        orderItems: {
          create: cartItems.map((item: any) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    });

    // Grant token - same as Flutter implementation
    const grantTokenResponse = await fetch(
      'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/token/grant',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'username': BKASH_USERNAME,
          'password': BKASH_PASSWORD,
        },
        body: JSON.stringify({
          app_key: BKASH_APP_KEY,
          app_secret: BKASH_APP_SECRET,
        }),
      }
    );

    const grantTokenData = await grantTokenResponse.json();

    if (!grantTokenData.id_token) {
      // Rollback stock reservation if bKash token fails
      for (const reservation of stockReservations) {
        await prisma.product.update({
          where: { id: reservation.productId },
          data: { stock: reservation.previousStock }
        });
      }

      // Delete the pending order
      await prisma.order.delete({
        where: { id: order.id }
      });

      return res.status(400).json({ success: false, error: 'Failed to get token' });
    }

    // Create payment - use order ID as merchantInvoiceNumber
    const createPaymentResponse = await fetch(
      'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/create',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': grantTokenData.id_token,
          'X-App-Key': BKASH_APP_KEY,
        },
        body: JSON.stringify({
          mode: '0011',
          payerReference: '01770618576',
          callbackURL: `${req.headers.origin || 'http://localhost:3000'}/api/bkash/callback`,
          amount: amount,
          currency: 'BDT',
          intent: 'sale',
          merchantInvoiceNumber: order.id.toString(), // Use order ID
        }),
      }
    );

    const createPaymentData = await createPaymentResponse.json();

    if (!createPaymentData.bkashURL) {
      // Rollback stock reservation if payment creation fails
      for (const reservation of stockReservations) {
        await prisma.product.update({
          where: { id: reservation.productId },
          data: { stock: reservation.previousStock }
        });
      }

      // Delete the pending order
      await prisma.order.delete({
        where: { id: order.id }
      });

      return res.status(400).json({ success: false, error: 'Failed to create payment' });
    }

    return res.status(200).json({
      success: true,
      bkashURL: createPaymentData.bkashURL,
      paymentID: createPaymentData.paymentID,
      orderId: order.id,
    });
  } catch (error) {
    console.error('bKash error:', error);
    return res.status(500).json({ success: false, error: 'Something went wrong' });
  } finally {
    await prisma.$disconnect();
  }
}
