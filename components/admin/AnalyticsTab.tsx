import React, { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { DollarSign, ShoppingBag, TrendingUp, Package, Users } from 'lucide-react';

interface AnalyticsData {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    averageCLV: number;
    topCustomers: Array<{ email: string; total: number }>;
    chartData: Array<{ date: string; revenue: number; orders: number }>;
    productPerformance: Array<{
        id: number;
        name: string;
        totalSold: number;
        revenue: number;
        stock: number;
        isArchived: boolean;
    }>;
    recentTransactions: Array<{
        id: number;
        date: string;
        customer: string;
        total: number;
        status: string;
    }>;
}

export const AnalyticsTab = ({ darkMode }: { darkMode: boolean }) => {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('/api/admin/analytics');
            const json = await res.json();
            if (json.success) {
                setData(json.data);
            } else {
                setError(json.error || 'Failed to load analytics');
            }
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading analytics...</div>;
    }

    if (error || !data) {
        return <div className="p-8 text-center text-red-500">{error || 'No data available'}</div>;
    }

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Revenue</h3>
                        <DollarSign className="text-green-500" />
                    </div>
                    <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        ৳{data.totalRevenue.toFixed(2)}
                    </p>
                </div>

                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Orders</h3>
                        <ShoppingBag className="text-blue-500" />
                    </div>
                    <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {data.totalOrders}
                    </p>
                </div>

                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Avg. Order Value</h3>
                        <TrendingUp className="text-purple-500" />
                    </div>
                    <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        ৳{data.averageOrderValue.toFixed(2)}
                    </p>
                </div>

                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Avg. CLV</h3>
                        <Users className="text-orange-500" />
                    </div>
                    <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        ৳{data.averageCLV.toFixed(2)}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Top Customers */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
                    <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Top Customers</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Customer</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider">Total Spend</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                {data.topCustomers.map((customer, idx) => (
                                    <tr key={idx} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                                        <td className={`px-4 py-3 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {customer.email}
                                        </td>
                                        <td className={`px-4 py-3 whitespace-nowrap text-right text-sm font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                            ৳{customer.total.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Revenue Chart */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg lg:col-span-2`}>
                    <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Revenue Over Time</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                                <XAxis
                                    dataKey="date"
                                    stroke={darkMode ? '#9ca3af' : '#4b5563'}
                                    tick={{ fill: darkMode ? '#9ca3af' : '#4b5563' }}
                                />
                                <YAxis
                                    stroke={darkMode ? '#9ca3af' : '#4b5563'}
                                    tick={{ fill: darkMode ? '#9ca3af' : '#4b5563' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: darkMode ? '#1f2937' : '#fff',
                                        borderColor: darkMode ? '#374151' : '#e5e7eb',
                                        color: darkMode ? '#fff' : '#000'
                                    }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue (৳)" />
                                <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} name="Orders" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Product Performance */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
                <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Product Performance</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Sold</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Revenue</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Stock</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                            {data.productPerformance.map((product) => (
                                <tr key={product.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                                    <td className={`px-6 py-4 whitespace-nowrap font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {product.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.isArchived
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-green-100 text-green-800'
                                            }`}>
                                            {product.isArchived ? 'Archived' : 'Active'}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-right ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                        {product.totalSold}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-right font-medium ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                        ৳{product.revenue.toFixed(2)}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-right ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                        {product.stock}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Transactions (Accounting View) */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg shadow-lg`}>
                <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Recent Transactions (Accounting)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Amount</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                            {data.recentTransactions.map((tx) => (
                                <tr key={tx.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                                    <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                        {new Date(tx.date).toLocaleDateString()}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                        #{tx.id}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {tx.customer}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-right font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        ৳{tx.total.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
