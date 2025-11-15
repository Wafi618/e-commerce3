import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface RestrictedAccessModalProps {
  userEmail: string;
  onClose: () => void;
}

export const RestrictedAccessModal: React.FC<RestrictedAccessModalProps> = ({ userEmail, onClose }) => {
  const [formData, setFormData] = useState({
    subject: 'Password Reset Request - Restricted Access',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSendRequest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/request-reset-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          subject: formData.subject,
          message: formData.message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message || 'Request sent successfully! Admin will contact you.');
        onClose();
      } else {
        alert(data.error || 'Failed to send request');
      }
    } catch (err) {
      alert('Network error. Failed to send request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-xl font-bold text-gray-900">Restricted Access</h3>
            <p className="text-sm text-gray-600 mt-1">
              Your account has restricted access because you don't have a phone number or PIN set for password recovery.
            </p>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-orange-800">
            <strong>You can only access messaging.</strong> To unlock full access:
          </p>
          <ul className="list-disc list-inside text-sm text-orange-700 mt-2 space-y-1">
            <li>Add a phone number to your profile, OR</li>
            <li>Set a 3-digit PIN, OR</li>
            <li>Contact admin for help</li>
          </ul>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message to Admin *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Request password reset or account unlock..."
              rows={4}
              required
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 disabled:opacity-50"
            >
              Close
            </button>
            <button
              onClick={handleSendRequest}
              disabled={loading || !formData.message}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
