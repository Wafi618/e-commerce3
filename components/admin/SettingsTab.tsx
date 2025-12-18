import React, { useState, useEffect } from 'react';
import { Mail, Save, AlertCircle, CheckCircle } from 'lucide-react';

export const SettingsTab = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (data.success && data.data) {
                // checks if explicit false string, otherwise defaults true
                setEmailEnabled(data.data.email_notifications_enabled !== 'false');
            }
        } catch (error) {
            console.error('Failed to fetch settings', error);
            setMessage({ type: 'error', text: 'Failed to load settings.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: 'email_notifications_enabled',
                    value: String(emailEnabled)
                }),
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ type: 'success', text: 'Settings saved successfully!' });
            } else {
                setMessage({ type: 'error', text: 'Failed to save settings.' });
            }
        } catch (error) {
            console.error('Error saving settings', error);
            setMessage({ type: 'error', text: 'An error occurred while saving.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-white">Loading settings...</div>;

    return (
        <div className="max-w-2xl">
            {message && (
                <div className={`p-4 rounded-lg mb-6 flex items-center gap-2 ${message.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            <div className="bg-gray-700/50 p-6 rounded-lg border border-gray-600 mb-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-900/50 rounded-lg">
                        <Mail className="text-blue-400" size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-medium text-white mb-2">Email Notifications</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Toggle all automated email notifications directly from here. This affects order confirmations for customers and "Order Received" alerts for admins.
                        </p>

                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={emailEnabled}
                                    onChange={(e) => setEmailEnabled(e.target.checked)}
                                />
                                <div className={`w-12 h-6 rounded-full transition-colors ${emailEnabled ? 'bg-blue-600' : 'bg-gray-600'}`}></div>
                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${emailEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                            <span className={`font-medium transition-colors ${emailEnabled ? 'text-white' : 'text-gray-400'}`}>
                                {emailEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Settings'}
            </button>
        </div>
    );
};
