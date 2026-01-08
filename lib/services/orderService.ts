import { prisma } from '@/lib/prisma';
// Types refreshed after schema update
import { CreateOrderInput, OrderFilter } from '@/types/service';
import { sendDiscordNotification } from '@/utils/discord';
import { sendTelegramNotification } from '@/utils/telegram';
import { Prisma, OrderStatus } from '@prisma/client';
import { sendOrderConfirmationEmail, sendAdminOrderReceivedEmail } from '@/lib/services/emailService';
import Decimal from 'decimal.js';

// Define the type for the order with includes
type OrderWithItems = Prisma.OrderGetPayload<{
  include: {
    orderItems: {
      include: {
        product: {
          include: {
            options: {
              include: {
                values: true
              }
            }
          }
        }
      }
    }
  }
}>;

export class OrderService {

  /**
   * Fetch all orders with optional filtering
   */
  static async getOrders(filter: OrderFilter) {
    const where: Prisma.OrderWhereInput = {};

    if (filter.status && filter.status !== 'all') {
      where.status = filter.status.toUpperCase() as any; // Allow explicit cast for flexibility vs strict enum match
    }

    if (filter.email) {
      where.email = {
        contains: filter.email,
        mode: 'insensitive',
      };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                options: {
                  include: {
                    values: true
                  }
                }
              }
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map(this.formatOrder);
  }

  /**
   * Create a manual order with stock management
   */
  static async createManualOrder(input: CreateOrderInput) {
    const { items, ...orderData } = input;

    // Transaction for stock safety
    const orderId = await prisma.$transaction(async (tx) => {
      // 1. Validate and Reserve Stock
      for (const item of items) {
        const productId = item.id || item.productId;
        if (!productId) throw new Error("Product ID missing");

        const product = await tx.product.findUnique({
          where: { id: parseInt(String(productId)) },
          select: { stock: true, name: true },
        });

        if (!product) {
          throw new Error(`Product not found`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`);
        }

        // Decrement stock
        await tx.product.update({
          where: { id: parseInt(String(productId)) },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 2. Create Order
      const order = await tx.order.create({
        data: {
          ...(orderData.userId && {
            user: { connect: { id: orderData.userId } },
          }),
          customer: orderData.customerName,
          email: orderData.email,
          phone: orderData.phone || null,
          city: orderData.city || null,
          country: orderData.country || null,
          address: orderData.address || null,
          house: orderData.house || null,
          floor: orderData.floor || null,
          notes: orderData.notes || null,
          total: new Decimal(orderData.total),
          // @ts-ignore
          shippingCost: new Decimal(orderData.shippingCost || 0),
          // @ts-ignore
          discountAmount: new Decimal(orderData.discountAmount || 0),
          // @ts-ignore
          couponCode: orderData.couponCode || null,
          status: (orderData.status as OrderStatus) || 'PENDING',
          paymentMethod: orderData.paymentMethod,
          paymentPhoneNumber: orderData.paymentPhoneNumber,
          paymentTrxId: orderData.paymentTrxId,
          orderItems: {
            create: items.map((item) => ({
              productId: parseInt(String(item.id || item.productId!)),
              quantity: item.quantity,
              price: item.price,
              selectedOptions: (item.selectedOptions as Prisma.InputJsonValue) || Prisma.JsonNull,
            })),
          },
        },
      });

      // 3. Clear Cart (if user logged in)
      if (orderData.userId) {
        await tx.cartItem.deleteMany({
          where: { userId: orderData.userId },
        });
      }

      return order.id;
    });

    // Notifications (Fire and forget)
    this.sendNotifications(String(orderId), input).catch(console.error);
    sendOrderConfirmationEmail(input.email, String(orderId), input).catch(console.error);
    sendAdminOrderReceivedEmail(String(orderId), input).catch(console.error);

    return orderId;
  }

  /**
   * Helper to format order for frontend (resolves variant images)
   */
  private static formatOrder(order: OrderWithItems) {
    return {
      id: order.id,
      customer: order.customer,
      email: order.email,
      total: order.total,
      status: order.status.toLowerCase(),
      date: order.createdAt.toISOString().split('T')[0],
      items: order.orderItems.length,
      orderItems: order.orderItems.map((item) => {
        let image = item.product.image;

        // Logic to determine image based on selectedOptions
        if (item.selectedOptions) {
          const selectedOpts = item.selectedOptions as Record<string, string>;
          for (const [optName, optValue] of Object.entries(selectedOpts)) {
            const option = item.product.options.find((o) => o.name === optName);
            if (option) {
              const value = option.values.find((v) => v.name === optValue);
              if (value && value.image && value.image.trim() !== '') {
                image = value.image;
                break;
              }
            }
          }
        }

        // Fallback if main image is empty
        if (!image || image.trim() === '') {
          const fallbackOption = item.product.options.find((o) => o.values.some((v) => v.image && v.image.trim() !== ''));
          if (fallbackOption) {
            const fallbackValue = fallbackOption.values.find((v) => v.image && v.image.trim() !== '');
            if (fallbackValue) {
              image = fallbackValue.image || '';
            }
          }
        }

        return {
          ...item,
          product: {
            ...item.product,
            image: image,
          },
          imageRotation: (image === item.product.image ? (item.product as any).imageRotation : (item.product as any).options?.flatMap((o: any) => o.values).find((v: any) => v.image === image)?.rotation) || 0,
        };
      }),
      paymentMethod: order.paymentMethod,
      paymentPhoneNumber: order.paymentPhoneNumber,
      paymentTrxId: order.paymentTrxId,
      phone: order.phone,
      address: order.address,
      city: order.city,
      country: order.country,
      house: order.house,
      floor: order.floor,
      notes: order.notes,
      // @ts-ignore
      shippingCost: order.shippingCost,
      // @ts-ignore
      discountAmount: order.discountAmount,
      // @ts-ignore
      couponCode: order.couponCode,
    };
  }

  private static async sendNotifications(orderId: string, input: CreateOrderInput) {
    const notificationItems = input.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      selectedOptions: item.selectedOptions
    }));

    const notificationOrderData = {
      id: orderId,
      customer: input.customerName,
      phone: input.phone,
      total: input.total,
      address: input.address,
      city: input.city,
      paymentMethod: input.paymentMethod
    };

    await Promise.all([
      sendDiscordNotification(notificationOrderData, notificationItems),
      sendTelegramNotification(notificationOrderData, notificationItems)
    ]);
  }
}