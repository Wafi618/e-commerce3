import nodemailer from 'nodemailer';
import { CreateOrderInput } from '@/types/service';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

export const sendOrderConfirmationEmail = async (
    to: string,
    orderId: string,
    orderDetails: CreateOrderInput
) => {
    // Defensive check to ensure we don't try to send without credentials
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.warn('Gmail credentials not found. Skipping email.');
        return;
    }

    const { customerName, total, items, address, city, country, paymentMethod } = orderDetails;

    const itemsHtml = items
        .map(
            (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name || 'Product'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">$${item.price.toFixed(2)}</td>
    </tr>
  `
        )
        .join('');

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #2563eb;">Order Confirmation</h2>
      <p>Hi ${customerName},</p>
      <p>Thank you for your order! We have received it and are processing it now.</p>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order #${orderId}</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="text-align: left; background: #e5e7eb;">
              <th style="padding: 12px;">Item</th>
              <th style="padding: 12px;">Qty</th>
              <th style="padding: 12px;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold;">Total:</td>
              <td style="padding: 12px; font-weight: bold;">$${Number(total).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style="margin-top: 20px;">
        <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px;">Shipping Details</h3>
        <p>
          ${address || ''}<br>
          ${city || ''}, ${country || ''}
        </p>
        <p><strong>Payment Method:</strong> ${paymentMethod}</p>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #666;">
        If you have any questions, please reply to this email.
      </p>
    </div>
  `;

    try {
        await transporter.sendMail({
            from: `"Ecommerce Store" <${process.env.GMAIL_USER}>`,
            to,
            subject: `Order Confirmation #${orderId}`,
            html,
        });
        console.log(`Order verification email sent to ${to} for order ${orderId}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};
