import nodemailer from 'nodemailer';
import { CreateOrderInput } from '@/types/service';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const formatOptions = (selectedOptions?: any) => {
  if (!selectedOptions || typeof selectedOptions !== 'object') return '';

  // If it's a string, try to parse it (though typing says InputJsonValue, safe to check)
  if (typeof selectedOptions === 'string') {
    try {
      const parsed = JSON.parse(selectedOptions);
      if (typeof parsed !== 'object') return selectedOptions;
      selectedOptions = parsed;
    } catch (e) {
      return selectedOptions;
    }
  }

  return Object.entries(selectedOptions)
    .map(([key, value]) => `<div style="font-size: 12px; color: #666;">${key}: ${value}</div>`)
    .join('');
};

const generateOrderItemsHtml = (items: CreateOrderInput['items']) => {
  return items.map((item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <div style="font-weight: 500;">${item.name || 'Product'}</div>
        ${formatOptions(item.selectedOptions)}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">৳${item.price.toFixed(2)}</td>
    </tr>
  `).join('');
};

export const sendOrderConfirmationEmail = async (
  to: string,
  orderId: string,
  orderDetails: CreateOrderInput
) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Gmail credentials not found. Skipping email.');
    return;
  }

  try {
    // Check if global email setting is enabled
    const { prisma } = require('@/lib/prisma');
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'email_notifications_enabled' }
    });

    if (setting && setting.value === 'false') {
      console.log('Customer Email skipped due to global setting.');
      return;
    }
  } catch (error) {
    console.error('Error checking email settings:', error);
  }

  const { customerName, total, items, address, city, country, paymentMethod } = orderDetails;
  const itemsHtml = generateOrderItemsHtml(items);

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
              <td style="padding: 12px; font-weight: bold;">৳${Number(total).toFixed(2)}</td>
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

export const sendAdminOrderReceivedEmail = async (
  orderId: string,
  orderDetails: CreateOrderInput
) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Gmail credentials not found. Skipping admin email.');
    return;
  }

  try {
    // Check if global email setting is enabled
    const { prisma } = require('@/lib/prisma');
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'email_notifications_enabled' }
    });

    if (setting && setting.value === 'false') {
      console.log('Admin Email skipped due to global setting.');
      return;
    }
  } catch (error) {
    console.error('Error checking email settings:', error);
  }

  const { customerName, total, items, address, city, country, paymentMethod, email, phone } = orderDetails;
  const itemsHtml = generateOrderItemsHtml(items);

  // Recipients: Admin (GMAIL_USER) + CEOs
  const recipients = [process.env.GMAIL_USER];
  if (process.env.CEO_EMAILS) {
    const ceoEmails = process.env.CEO_EMAILS.split(',').map(e => e.trim());
    recipients.push(...ceoEmails);
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #16a34a;">New Order Received! 🚀</h2>
      <p>A new order has been placed by <strong>${customerName}</strong>.</p>
      
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
        <h3 style="margin-top: 0;">Order #${orderId}</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="text-align: left; background: #dcfce7;">
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
              <td style="padding: 12px; font-weight: bold;">৳${Number(total).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style="margin-top: 20px; background: #f9fafb; padding: 15px; border-radius: 8px;">
        <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 0;">Customer Details</h3>
        <p><strong>Name:</strong> ${customerName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
        <p><strong>Address:</strong><br>
          ${address || ''}<br>
          ${city || ''}, ${country || ''}
        </p>
        <p><strong>Payment Method:</strong> ${paymentMethod}</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Ecommerce Store System" <${process.env.GMAIL_USER}>`,
      to: recipients.join(','), // Send to all recipients
      subject: `New Order #${orderId} from ${customerName}`,
      html,
    });
    console.log(`Admin order notification sent to ${recipients.length} recipients for order ${orderId}`);
  } catch (error) {
    console.error('Error sending admin email:', error);
  }
};
