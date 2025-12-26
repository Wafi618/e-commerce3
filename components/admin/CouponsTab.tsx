import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts';
import { Plus, Trash, Edit, RefreshCw } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';

interface Coupon {
    id: string;
    code: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    usedCount: number;
    oneUsePerCustomer: boolean;
    isActive: boolean;
    expiresAt?: string;
}

export const CouponsTab: React.FC = () => {
    const { darkMode } = useTheme();
    const { addNotification } = useNotification();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Coupon>>({
        code: '',
        type: 'PERCENTAGE',
        value: 0,
        minOrderAmount: 0,
        maxDiscountAmount: 0,
        usageLimit: 0,
        oneUsePerCustomer: true,
        isActive: true,
        expiresAt: ''
    });

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/coupons');
            const data = await res.json();
            if (data.success) {
                setCoupons(data.data);
            } else {
                addNotification(data.message, 'error');
            }
        } catch (error) {
            addNotification('Failed to fetch coupons', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this coupon?')) return;
        try {
            const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                addNotification('Coupon deleted', 'success');
                fetchCoupons();
            } else {
                addNotification(data.message, 'error');
            }
        } catch (error) {
            addNotification('Failed to delete coupon', 'error');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId ? `/api/admin/coupons/${editingId}` : '/api/admin/coupons';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();

            if (data.success) {
                addNotification(editingId ? 'Coupon updated' : 'Coupon created', 'success');
                setShowModal(false);
                setEditingId(null);
                setFormData({ code: '', type: 'PERCENTAGE', value: 0 }); // Reset base
                fetchCoupons();
            } else {
                addNotification(data.message, 'error');
            }
        } catch (error) {
            addNotification('Failed to save coupon', 'error');
        }
    };

    const openEdit = (coupon: Coupon) => {
        setEditingId(coupon.id);
        setFormData({
            ...coupon,
            expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : ''
        });
        setShowModal(true);
    };

    const openCreate = () => {
        setEditingId(null);
        setFormData({
            code: '',
            type: 'PERCENTAGE',
            value: 0,
            minOrderAmount: 0,
            maxDiscountAmount: 0,
            usageLimit: 0,
            oneUsePerCustomer: true,
            isActive: true,
            expiresAt: ''
        });
        setShowModal(true);
    };

    return (
        <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-6">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Coupon Management
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={fetchCoupons}
                        className={`p-2 rounded-lg border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}
                    >
                        <RefreshCw size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
                    </button>
                    <button
                        onClick={openCreate}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus size={20} /> New Coupon
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className={`text-xs uppercase ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-50 text-gray-700'}`}>
                        <tr>
                            <th className="px-6 py-3">Code</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3">Value</th>
                            <th className="px-6 py-3">Usage</th>
                            <th className="px-6 py-3">Expires</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {coupons.map((coupon) => (
                            <tr key={coupon.id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                <td className="px-6 py-4 font-medium">{coupon.code}</td>
                                <td className="px-6 py-4">{coupon.type}</td>
                                <td className="px-6 py-4">{Number(coupon.value)} {coupon.type === 'PERCENTAGE' ? '%' : 'Tk'}</td>
                                <td className="px-6 py-4">{coupon.usedCount} / {coupon.usageLimit || '∞'}</td>
                                <td className="px-6 py-4">{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : 'Never'}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {coupon.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 flex gap-2">
                                    <button onClick={() => openEdit(coupon)} className="text-blue-500 hover:text-blue-700">
                                        <Edit size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(coupon.id)} className="text-red-500 hover:text-red-700">
                                        <Trash size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {coupons.length === 0 && !loading && (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No coupons found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-md w-full p-6 overflow-y-auto max-h-[90vh]`}>
                        <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {editingId ? 'Edit Coupon' : 'Create Coupon'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Code</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                        className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                                    >
                                        <option value="PERCENTAGE">Percentage (%)</option>
                                        <option value="FIXED">Fixed Amount (Tk)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Value</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                                        className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Min Order</label>
                                    <input
                                        type="number"
                                        value={formData.minOrderAmount}
                                        onChange={e => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                                        className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Max Discount (for %)</label>
                                    <input
                                        type="number"
                                        value={formData.maxDiscountAmount}
                                        onChange={e => setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) })}
                                        className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Usage Limit</label>
                                    <input
                                        type="number"
                                        value={formData.usageLimit}
                                        onChange={e => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                                        className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Expires At</label>
                                    <input
                                        type="date"
                                        value={formData.expiresAt ? String(formData.expiresAt) : ''}
                                        onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                                        className={`w-full px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Active</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.oneUsePerCustomer}
                                        onChange={e => setFormData({ ...formData, oneUsePerCustomer: e.target.checked })}
                                    />
                                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>One per Customer</span>
                                </label>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className={`flex-1 px-4 py-2 border rounded-lg ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
