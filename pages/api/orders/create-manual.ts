import { NextApiRequest, NextApiResponse } from 'next';
import { manualCheckoutSchema } from '@/lib/schemas';
import { OrderService } from '@/lib/services/orderService';

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

    const orderId = await OrderService.createManualOrder({
      customerName,
      email: customerEmail,
      userId,
      phone,
      city,
      country,
      address,
      house,
      floor,
      notes,
      total: Number(amount), // Schema already validates this as number (or transform if needed, but OrderService expects number)
      status: 'PENDING',
      paymentMethod: 'MANUAL_BKASH',
      paymentPhoneNumber: bkashNumber,
      paymentTrxId: trxId,
      items: cartItems.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        name: item.name,
        selectedOptions: item.selectedOptions
      }))
    });

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
  }
}
