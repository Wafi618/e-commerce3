import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Phone, Loader2 } from 'lucide-react';

export function PhoneVerificationModal() {
    const { user, setUser, checkAuth } = useAuth();
    const { addNotification } = useNotification();
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    // Only show if user is logged in but has restricted access (missing phone)
    if (!user || !user.restrictedAccess) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone.trim()) return;

        setLoading(true);
        try {
            const response = await fetch('/api/user/update-phone', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });

            const data = await response.json();

            if (data.success) {
                addNotification('Phone number verified successfully!', 'success');
                // Refresh auth state
                const updatedUser = await checkAuth();
                if (updatedUser) {
                    setUser(updatedUser);
                }
                // Force reload to ensure session is fresh if needed, or just rely on state update
            } else {
                addNotification(data.error || 'Failed to update phone number', 'error');
            }
        } catch (error) {
            addNotification('Network error', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Phone className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Phone Number Required
                    </h2>

                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        To secure your account and prevent lockout, please provide a valid phone number. This is required to continue.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Enter your phone number"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Verify Phone Number'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
