import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Input } from '@/components/ui/Input';
import { useAuth, useTheme } from '@/contexts';
import { useNotification } from '@/contexts/NotificationContext';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { darkMode } = useTheme();
  const { addNotification } = useNotification();
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
    country: user?.country || 'Bangladesh',
    address: user?.address || '',
    house: user?.house || '',
    floor: user?.floor || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        city: user.city || '',
        country: user.country || 'Bangladesh',
        address: user.address || '',
        house: user.house || '',
        floor: user.floor || '',
      });
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);

    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data);
        addNotification('Profile updated successfully!', 'success');
      } else {
        addNotification(data.error || 'Failed to update profile', 'error');
      }
    } catch (err) {
      addNotification('Network error. Failed to update profile.', 'error');
      console.error('Profile update error:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <Layout title="My Profile" showBackButton>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>Profile & Delivery Information</h2>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: (e.target as HTMLInputElement).value })}
              placeholder="Enter your full name"
              darkMode={darkMode}
            />

            <Input
              label="Phone Number"
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: (e.target as HTMLInputElement).value })}
              placeholder="+880 1234 567890"
              darkMode={darkMode}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                type="text"
                value={profileData.city}
                onChange={(e) => setProfileData({ ...profileData, city: (e.target as HTMLInputElement).value })}
                placeholder="Dhaka"
                darkMode={darkMode}
              />

              <Input
                label="Country"
                type="text"
                value={profileData.country}
                onChange={(e) => setProfileData({ ...profileData, country: (e.target as HTMLInputElement).value })}
                placeholder="Bangladesh"
                darkMode={darkMode}
              />
            </div>

            <Input
              label="Street Address"
              type="text"
              value={profileData.address}
              onChange={(e) => setProfileData({ ...profileData, address: (e.target as HTMLInputElement).value })}
              placeholder="Road 12, Banani"
              darkMode={darkMode}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="House/Building"
                type="text"
                value={profileData.house}
                onChange={(e) => setProfileData({ ...profileData, house: (e.target as HTMLInputElement).value })}
                placeholder="House #25"
                darkMode={darkMode}
              />

              <Input
                label="Floor/Unit"
                type="text"
                value={profileData.floor}
                onChange={(e) => setProfileData({ ...profileData, floor: (e.target as HTMLInputElement).value })}
                placeholder="3rd Floor, Apt 5B"
                darkMode={darkMode}
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {profileLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Save Profile'
              )}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
