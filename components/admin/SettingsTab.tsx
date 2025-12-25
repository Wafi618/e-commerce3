import React, { useState, useEffect } from 'react';
import { Mail, Save, AlertCircle, CheckCircle } from 'lucide-react';

export const SettingsTab = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [favicon, setFavicon] = useState('');
    const [logo, setLogo] = useState('');
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (data.success && data.data) {
                setEmailEnabled(data.data.email_notifications_enabled !== 'false');
                setFavicon(data.data.favicon_url || '');
                setLogo(data.data.logo_url || '');
            }
        } catch (error) {
            console.error('Failed to fetch settings', error);
            setMessage({ type: 'error', text: 'Failed to load settings.' });
        } finally {
            setLoading(false);
        }
    };

    const uploadFile = async (file: File, type: 'favicon' | 'logo') => {
        setUploading(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64 = reader.result as string;
            try {
                const res = await fetch('/api/admin/upload-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: base64 }),
                });
                const data = await res.json();
                if (data.success) {
                    if (type === 'favicon') setFavicon(data.url);
                    else setLogo(data.url);
                } else {
                    alert('Upload failed');
                }
            } catch (err) {
                console.error(err);
                alert('Error uploading image');
            } finally {
                setUploading(false);
            }
        };
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            // Save Email Setting
            await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'email_notifications_enabled', value: String(emailEnabled) }),
            });

            // Save Favicon
            await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'favicon_url', value: favicon }),
            });

            // Save Logo
            await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'logo_url', value: logo }),
            });

            setMessage({ type: 'success', text: 'All settings saved successfully!' });
            // Optional: Reload page to apply changes
            if (favicon || logo) {
                setTimeout(() => window.location.reload(), 1500);
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

            {/* Email Settings */}
            <div className="bg-gray-700/50 p-6 rounded-lg border border-gray-600 mb-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-900/50 rounded-lg">
                        <Mail className="text-blue-400" size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-medium text-white mb-2">Email Notifications</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Toggle all automated email notifications directly from here.
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

            {/* Appearance Settings */}
            <div className="bg-gray-700/50 p-6 rounded-lg border border-gray-600 mb-6">
                <h3 className="text-lg font-medium text-white mb-4">Appearance</h3>

                {/* Favicon Section */}
                <div className="mb-6 pb-6 border-b border-gray-600">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Browser Tab Icon (Favicon)</label>
                    <p className="text-xs text-gray-400 mb-3">Upload a <b>square</b> image (e.g. 32x32 or 64x64). Rectangular images will look "squished".</p>

                    <div className="flex items-start gap-6">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 bg-gray-900 rounded border border-gray-600 flex items-center justify-center overflow-hidden" title="Actual size preview (16px)">
                                {favicon ? <img src={favicon} className="w-4 h-4 object-contain" /> : <span className="text-gray-600 text-[8px]">16px</span>}
                            </div>
                            <span className="text-[10px] text-gray-500">Tab Preview</span>
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="text"
                                    value={favicon}
                                    onChange={(e) => setFavicon(e.target.value)}
                                    placeholder="https://..."
                                    className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-blue-500"
                                />
                                <label className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1.5 rounded text-sm cursor-pointer transition-colors">
                                    Upload
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], 'favicon')}
                                        disabled={uploading}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navbar Logo Section */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Website Logo (Navbar)</label>
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="text"
                            value={logo}
                            onChange={(e) => setLogo(e.target.value)}
                            placeholder="https://..."
                            className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-blue-500"
                        />
                        <label className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1.5 rounded text-sm cursor-pointer transition-colors">
                            Upload
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], 'logo')}
                                disabled={uploading}
                            />
                        </label>
                    </div>
                    {logo && (
                        <div className="mt-2 p-2 bg-black rounded border border-gray-700 inline-block">
                            <img src={logo} alt="Logo Preview" className="h-8 object-contain" />
                        </div>
                    )}
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
