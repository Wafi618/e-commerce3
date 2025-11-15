import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';


const BKASH_USERNAME = process.env.BKASH_USERNAME || '';
const BKASH_PASSWORD = process.env.BKASH_PASSWORD || '';
const BKASH_APP_KEY = process.env.BKASH_APP_KEY || '';
const BKASH_APP_SECRET = process.env.BKASH_APP_SECRET || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { paymentID, status } = req.query;

  // TEMPORARY: For testing without bKash sandbox - treat all as successful
  // When bKash sandbox works, comment out this block and uncomment the real implementation below
  try {
    // Find the PENDING order using merchantInvoiceNumber (which is the order ID)
    // Note: In real bKash implementation, we would get merchantInvoiceNumber from execute response
    // For testing, we need to extract it from the paymentID or pass it differently
    // For now, we'll search for any recent PENDING order (this is test mode only)

    const pendingOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          gte: new Date(Date.now() - 3600000) // Within last hour
        }
      },
      include: {
        orderItems: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    });

    const order = pendingOrders[0];

    if (order) {
      // Update order status to PROCESSING
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'PROCESSING' },
      });

      // NOTE: Stock is already decremented in checkout.ts when order is created
      // No need to decrement again here - this would cause double deduction!

      // Update user profile with checkout address data
      if (order.userId) {
        const updateData: any = {};
        if (order.phone) updateData.phone = order.phone;
        if (order.city) updateData.city = order.city;
        if (order.country) updateData.country = order.country;
        if (order.address) updateData.address = order.address;
        if (order.house) updateData.house = order.house;
        if (order.floor) updateData.floor = order.floor;

        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: order.userId },
            data: updateData,
          });
        }

        // Clear user's cart
        await prisma.cartItem.deleteMany({
          where: { userId: order.userId },
        });
      }

      return res.redirect(`/checkout/success?payment_id=TEST_${paymentID}&trx_id=TEST_TRX_${Date.now()}&order_id=${order.id}&clear_cart=true`);
    }

    return res.redirect(`/checkout/success?payment_id=TEST_${paymentID}&trx_id=TEST_TRX_${Date.now()}`);
  } catch (error) {
    console.error('Callback error:', error);
    return res.redirect('/checkout/cancel');
  } finally {
    await prisma.$disconnect();
  }

  /*
  // REAL IMPLEMENTATION (use when bKash sandbox is working):

  if (status === 'cancel' || status === 'failure') {
    return res.redirect('/checkout/cancel');
  }

  try {
    // Grant token
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

    // Execute payment
    const executeResponse = await fetch(
      'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/execute',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': grantTokenData.id_token,
          'X-App-Key': BKASH_APP_KEY,
        },
        body: JSON.stringify({ paymentID }),
      }
    );

    const executeData = await executeResponse.json();

    if (executeData.transactionStatus === 'Completed') {
      // Find the PENDING order using merchantInvoiceNumber (order ID)
      const orderId = parseInt(executeData.merchantInvoiceNumber);

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { orderItems: true },
      });

      if (order && order.status === 'PENDING') {
        // Update order status to PROCESSING
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'PROCESSING' },
        });

        // NOTE: Stock is already decremented in checkout.ts when order is created
        // No need to decrement again here - this would cause double deduction!

        // Update user profile with checkout address data
        if (order.userId) {
          const updateData: any = {};
          if (order.phone) updateData.phone = order.phone;
          if (order.city) updateData.city = order.city;
          if (order.country) updateData.country = order.country;
          if (order.address) updateData.address = order.address;
          if (order.house) updateData.house = order.house;
          if (order.floor) updateData.floor = order.floor;

          if (Object.keys(updateData).length > 0) {
            await prisma.user.update({
              where: { id: order.userId },
              data: updateData,
            });
          }

          // Clear user's cart
          await prisma.cartItem.deleteMany({
            where: { userId: order.userId },
          });
        }

        return res.redirect(`/checkout/success?session_id=${executeData.paymentID}&order_id=${order.id}&clear_cart=true`);
      }
    }

    return res.redirect('/checkout/cancel');
  } catch (error) {
    console.error('Callback error:', error);
    return res.redirect('/checkout/cancel');
  } finally {
    await prisma.$disconnect();
  }
  */
}