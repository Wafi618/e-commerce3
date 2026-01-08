import nodemailer from 'nodemailer';
import { CreateOrderInput } from '@/types/service';
import { render } from '@react-email/render';
import OrderConfirmationWrapper from '../../emails/OrderConfirmation';
import AdminNotificationWrapper from '../../emails/AdminNotification';
import ResetPasswordWrapper from '../../emails/ResetPassword';

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
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Gmail credentials not found. Skipping email.');
    return;
  }

  try {
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

  const { customerName, total, items, address, city, country, paymentMethod, shippingCost, discountAmount } = orderDetails;

  const html = await render(
    OrderConfirmationWrapper({
      orderId,
      customerName,
      items,
      total,
      address,
      city,
      country,
      paymentMethod,
      shippingCost,
      discountAmount,
    })
  );

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

  const recipients = [process.env.GMAIL_USER];
  if (process.env.CEO_EMAILS) {
    const ceoEmails = process.env.CEO_EMAILS.split(',').map(e => e.trim());
    recipients.push(...ceoEmails);
  }

  const html = await render(
    AdminNotificationWrapper({
      orderId,
      customerName,
      email,
      phone,
      items,
      total,
      address,
      city,
      country,
      paymentMethod,
    })
  );

  try {
    await transporter.sendMail({
      from: `"Ecommerce Store System" <${process.env.GMAIL_USER}>`,
      to: recipients.join(','),
      subject: `New Order #${orderId} from ${customerName}`,
      html,
    });
    console.log(`Admin order notification sent to ${recipients.length} recipients for order ${orderId}`);
  } catch (error) {
    console.error('Error sending admin email:', error);
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  userName: string = 'Customer'
) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Gmail credentials not found. Skipping password reset email.');
    return;
  }

  const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

  const html = await render(
    ResetPasswordWrapper({
      resetLink,
      userName,
    })
  );

  try {
    await transporter.sendMail({
      from: `"Ecommerce Store Security" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Reset Your Password',
      html,
    });
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
};

export const sendCustomerEmail = async (
  to: string,
  subject: string,
  content: string
) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Gmail credentials not found. Skipping customer email.');
    return;
  }

  try {
    // Simple HTML wrapper
    const html = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: #2563eb;">Message from Star Accessories</h2>
        <div style="white-space: pre-wrap; margin: 20px 0; color: #333;">${content}</div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">Please do not reply to this automated email.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Star Accessories Support" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Custom email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending customer email:', error);
    return false;
  }
};
