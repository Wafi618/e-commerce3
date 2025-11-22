import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Bell } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';

interface Announcement {
    id: number;
    message: string;
    expiresAt: string | null;
    isActive: boolean;
    createdAt: string;
}

export const AnnouncementsTab = ({ darkMode }: { darkMode: boolean }) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const { addNotification } = useNotification();

    // Form State
    const [message, setMessage] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await fetch('/api/admin/announcements');
            const json = await res.json();
            if (json.success) {
                setAnnouncements(json.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = '/api/admin/announcements';
            const method = editingId ? 'PUT' : 'POST';
            const body = {
                id: editingId,
                message,
                expiresAt: expiresAt || null,
                isActive
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const json = await res.json();
            if (json.success) {
                addNotification(editingId ? 'Announcement updated' : 'Announcement created', 'success');
                setShowModal(false);
                resetForm();
                fetchAnnouncements();
            } else {
                addNotification(json.error || 'Failed to save', 'error');
            }
        } catch (err) {
            addNotification('Network error', 'error');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;
        try {
            const res = await fetch('/api/admin/announcements', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                addNotification('Announcement deleted', 'success');
                setAnnouncements(prev => prev.filter(a => a.id !== id));
            }
        } catch (err) {
            addNotification('Failed to delete', 'error');
        }
    };

    const resetForm = () => {
        setMessage('');
        setExpiresAt('');
        setIsActive(true);
        setEditingId(null);
    };

    const openEdit = (announcement: Announcement) => {
        setMessage(announcement.message);
        setExpiresAt(announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().slice(0, 16) : '');
        setIsActive(announcement.isActive);
        setEditingId(announcement.id);
        setShowModal(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Storefront Announcements</h2>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus className="w-4 h-4" />
                    New Announcement
                </button>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
                <table className="w-full">
                    <thead className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Message</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Expires At</th>
                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        {announcements.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    No announcements found. Create one to display on the storefront ticker.
                                </td>
                            </tr>
                        ) : (
                            announcements.map((announcement) => (
                                <tr key={announcement.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                                    <td className={`px-6 py-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {announcement.message}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${announcement.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {announcement.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                        {announcement.expiresAt ? new Date(announcement.expiresAt).toLocaleString() : 'Never'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openEdit(announcement)}
                                                className={`p-2 rounded ${darkMode ? 'text-blue-400 hover:bg-gray-600' : 'text-blue-600 hover:bg-blue-50'}`}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(announcement.id)}
                                                className={`p-2 rounded ${darkMode ? 'text-red-400 hover:bg-gray-600' : 'text-red-600 hover:bg-red-50'}`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-md w-full p-6`}>
                        <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                            {editingId ? 'Edit Announcement' : 'New Announcement'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                                    Message *
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                                    rows={3}
                                    required
                                    placeholder="Enter news headline..."
                                />
                            </div>

                            <div className="mb-4">
                                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                                    Expires At (Optional)
                                </label>
                                <input
                                    type="datetime-local"
                                    value={expiresAt}
                                    onChange={(e) => setExpiresAt(e.target.value)}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                                />
                            </div>

                            <div className="mb-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Active
                                    </span>
                                </label>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className={`flex-1 px-4 py-2 border rounded-lg ${darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}
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
