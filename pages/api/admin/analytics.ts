import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { getAuthOptions } from '../auth/[...nextauth]';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
    }

    try {
        const session = await getServerSession(req, res, getAuthOptions(req, res));

        if (!session || session.user?.role !== 'ADMIN') {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        // 1. Fetch all relevant orders (Completed or Shipping)
        const orders = await prisma.order.findMany({
            where: {
                status: {
                    in: ['COMPLETED', 'SHIPPING']
                }
            },
            include: {
                orderItems: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // 2. Aggregate Revenue Over Time (Daily)
        const revenueByDate: Record<string, number> = {};
        const ordersByDate: Record<string, number> = {};

        orders.forEach(order => {
            const date = order.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
            const total = Number(order.total);

            revenueByDate[date] = (revenueByDate[date] || 0) + total;
            ordersByDate[date] = (ordersByDate[date] || 0) + 1;
        });

        const chartData = Object.keys(revenueByDate).map(date => ({
            date,
            revenue: revenueByDate[date],
            orders: ordersByDate[date]
        }));

        // 3. Aggregate Product Performance
        const productStats: Record<number, {
            id: number;
            name: string;
            totalSold: number;
            revenue: number;
            stock: number;
            isArchived: boolean;
        }> = {};

        orders.forEach(order => {
            order.orderItems.forEach(item => {
                const pid = item.productId;
                if (!productStats[pid]) {
                    productStats[pid] = {
                        id: pid,
                        name: item.product.name,
                        totalSold: 0,
                        revenue: 0,
                        stock: item.product.stock,
                        isArchived: item.product.isArchived
                    };
                }
                productStats[pid].totalSold += item.quantity;
                productStats[pid].revenue += Number(item.price) * item.quantity;
            });
        });

        const productPerformance = Object.values(productStats).sort((a, b) => b.revenue - a.revenue);

        // 4. Calculate Totals
        const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // 5. Calculate CLV (Customer Lifetime Value)
        const customerSpend: Record<string, number> = {};
        orders.forEach(order => {
            // Use email as unique identifier as it's always present
            const customerId = order.email;
            customerSpend[customerId] = (customerSpend[customerId] || 0) + Number(order.total);
        });

        const uniqueCustomers = Object.keys(customerSpend).length;
        const averageCLV = uniqueCustomers > 0 ? totalRevenue / uniqueCustomers : 0;

        const topCustomers = Object.entries(customerSpend)
            .map(([email, total]) => ({ email, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5); // Top 5 customers

        return res.status(200).json({
            success: true,
            data: {
                totalRevenue,
                totalOrders,
                averageOrderValue,
                averageCLV,
                topCustomers,
                chartData,
                productPerformance,
                recentTransactions: orders.slice().reverse().slice(0, 50).map(o => ({ // Last 50 transactions
                    id: o.id,
                    date: o.createdAt,
                    customer: o.customer,
                    total: Number(o.total),
                    status: o.status
                }))
            }
        });

    } catch (error) {
        console.error('Analytics API Error:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
}
