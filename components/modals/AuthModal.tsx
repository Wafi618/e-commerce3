import React, { useState } from 'react';
import { useAuth } from '@/contexts';
import { useNotification } from '@/contexts/NotificationContext';

export const AuthModal: React.FC = () => {
  // Consume contexts directly
  const {
    authMode,
    setAuthMode,
    handleLogin,
    handleRegister,
    setShowAuthModal
  } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);

    try {
      if (authMode === 'login') {
        await handleLogin(formData.email, formData.password);
      } else {
        await handleRegister(formData.email, formData.password, formData.name, formData.phone);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          {authMode === 'login' ? 'Login' : 'Create Account'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'register' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="01XXXXXXXXX (10-15 digits)"
                  required
                  pattern="[0-9]{10,15}"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              required
              minLength={6}
            />
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              disabled={authLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={authLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {authLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                authMode === 'login' ? 'Login' : 'Register'
              )}
            </button>
          </div>
        </form>
        <div className="mt-4 text-center space-y-2">
          {authMode === 'login' && (
            <button
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-blue-600 hover:text-blue-700 block w-full"
            >
              Forgot Password?
            </button>
          )}
          <button
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {authMode === 'login'
              ? "Don't have an account? Register"
              : 'Already have an account? Login'}
          </button>
        </div>
      </div>
      {showForgotPassword && (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}
    </div>
  );
};

const ForgotPasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { addNotification } = useNotification();
  const [step, setStep] = useState<'method' | 'phone' | 'pin' | 'contact-admin'>('method');
  const [formData, setFormData] = useState({
    email: '',
    securityAnswer: '',
    pin: '',
    newPassword: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);

  const handleReset = async (method: 'security-question' | 'pin') => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          method,
          securityAnswer: method === 'security-question' ? formData.securityAnswer : undefined,
          pin: method === 'pin' ? formData.pin : undefined,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        addNotification('Password reset successful! Please login with your new password.', 'success');
        onClose();
      } else {
        addNotification(data.error || 'Password reset failed', 'error');
        if (data.attemptsRemaining !== undefined) {
          setAttemptsRemaining(data.attemptsRemaining);
        }
      }
    } catch (err) {
      addNotification('Network error. Failed to reset password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleContactAdmin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/request-reset-guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        }),
      });

      const data = await response.json();

      if (data.success) {
        addNotification(data.message || 'Password reset request sent to admin successfully!', 'success');
        onClose();
      } else {
        addNotification(data.error || 'Failed to send request', 'error');
      }
    } catch (err) {
      addNotification('Network error. Failed to send request.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Reset Password</h3>

        {step === 'method' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
                required
              />
            </div>
            <p className="text-sm text-gray-600">Choose a reset method:</p>
            <div className="space-y-3">
              <button
                onClick={() => setStep('phone')}
                disabled={!formData.email}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left disabled:opacity-50"
              >
                <div className="font-medium">Security Question</div>
                <div className="text-sm text-gray-600">Last 4 digits of phone number</div>
              </button>
              <button
                onClick={() => setStep('pin')}
                disabled={!formData.email}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left disabled:opacity-50"
              >
                <div className="font-medium">3-Digit PIN</div>
                <div className="text-sm text-gray-600">Use your preset PIN</div>
              </button>
              <button
                onClick={() => setStep('contact-admin')}
                disabled={!formData.email}
                className="w-full px-4 py-3 border border-orange-300 bg-orange-50 rounded-lg hover:bg-orange-100 text-left disabled:opacity-50"
              >
                <div className="font-medium text-orange-700">Contact Admin</div>
                <div className="text-sm text-orange-600">No phone or PIN? Message admin for help</div>
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              Cancel
            </button>
          </div>
        )}

        {step === 'phone' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last 4 digits of phone number *
              </label>
              <input
                type="text"
                value={formData.securityAnswer}
                onChange={(e) => setFormData({ ...formData, securityAnswer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="XXXX"
                maxLength={4}
                pattern="[0-9]{4}"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password *
              </label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new password"
                minLength={6}
                required
              />
            </div>
            {attemptsRemaining !== null && (
              <p className="text-sm text-red-600">
                {attemptsRemaining} attempts remaining
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('method')}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={() => handleReset('security-question')}
                disabled={loading || !formData.securityAnswer || !formData.newPassword}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        )}

        {step === 'pin' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                3-Digit PIN *
              </label>
              <input
                type="text"
                value={formData.pin}
                onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="XXX"
                maxLength={3}
                pattern="[0-9]{3}"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password *
              </label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new password"
                minLength={6}
                required
              />
            </div>
            {attemptsRemaining !== null && (
              <p className="text-sm text-red-600">
                {attemptsRemaining} attempts remaining
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setStep('method')}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={() => handleReset('pin')}
                disabled={loading || !formData.pin || !formData.newPassword}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        )}

        {step === 'contact-admin' && (
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-orange-800">
                <strong>No phone or PIN set?</strong> Send a message to admin.
                They will contact you to verify your identity and reset your password.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Password Reset Request"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message *
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Please explain your situation and request password reset..."
                rows={4}
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep('method')}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleContactAdmin}
                disabled={loading || !formData.subject || !formData.message}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
