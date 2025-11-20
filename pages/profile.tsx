import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Input } from '@/components/ui/Input';
import { useAuth, useTheme } from '@/contexts';
import { useNotification } from '@/contexts/NotificationContext';
import { Plus, Trash2, MapPin, Home } from 'lucide-react';

interface Address {
  id: string;
  label: string;
  phone: string;
  city: string;
  country: string;
  address: string;
  house?: string;
  floor?: string;
  isDefault: boolean;
}

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
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    phone: '',
    city: '',
    country: 'Bangladesh',
    address: '',
    house: '',
    floor: '',
    isDefault: false
  });

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/profile/addresses');
      const data = await res.json();
      if (data.success) {
        setAddresses(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch addresses', error);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

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

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/profile/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress),
      });
      const data = await res.json();
      if (data.success) {
        addNotification('Address added successfully', 'success');
        setAddresses([...addresses, data.data]);
        setShowAddAddress(false);
        setNewAddress({
          label: 'Home',
          phone: '',
          city: '',
          country: 'Bangladesh',
          address: '',
          house: '',
          floor: '',
          isDefault: false
        });
        // If default, refresh to update others
        if (newAddress.isDefault) fetchAddresses();
      } else {
        addNotification(data.error || 'Failed to add address', 'error');
      }
    } catch (error) {
      addNotification('Error adding address', 'error');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      const res = await fetch(`/api/profile/addresses?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setAddresses(addresses.filter(a => a.id !== id));
        addNotification('Address deleted', 'success');
      } else {
        addNotification(data.error, 'error');
      }
    } catch (error) {
      addNotification('Error deleting address', 'error');
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

        {/* Saved Addresses Section */}
        <div className={`mt-8 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-6`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Saved Addresses</h2>
            <button
              onClick={() => setShowAddAddress(!showAddAddress)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus className="w-5 h-5" />
              Add New
            </button>
          </div>

          {showAddAddress && (
            <form onSubmit={handleAddAddress} className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">New Address</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Label (e.g. Home, Office)"
                    value={newAddress.label}
                    onChange={(e) => setNewAddress({ ...newAddress, label: (e.target as HTMLInputElement).value })}
                    darkMode={darkMode}
                  />
                  <Input
                    label="Phone"
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: (e.target as HTMLInputElement).value })}
                    darkMode={darkMode}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="City"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: (e.target as HTMLInputElement).value })}
                    darkMode={darkMode}
                  />
                  <Input
                    label="Country"
                    value={newAddress.country}
                    onChange={(e) => setNewAddress({ ...newAddress, country: (e.target as HTMLInputElement).value })}
                    darkMode={darkMode}
                  />
                </div>
                <Input
                  label="Address"
                  value={newAddress.address}
                  onChange={(e) => setNewAddress({ ...newAddress, address: (e.target as HTMLInputElement).value })}
                  darkMode={darkMode}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="House"
                    value={newAddress.house}
                    onChange={(e) => setNewAddress({ ...newAddress, house: (e.target as HTMLInputElement).value })}
                    darkMode={darkMode}
                  />
                  <Input
                    label="Floor"
                    value={newAddress.floor}
                    onChange={(e) => setNewAddress({ ...newAddress, floor: (e.target as HTMLInputElement).value })}
                    darkMode={darkMode}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={newAddress.isDefault}
                    onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isDefault" className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Set as default address</label>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddAddress(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-600 dark:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Address
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {addresses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No saved addresses found.</p>
            ) : (
              addresses.map((addr) => (
                <div key={addr.id} className={`p-4 border rounded-lg flex justify-between items-start ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{addr.label}</span>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">Default</span>
                      )}
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{addr.address}, {addr.city}, {addr.country}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{addr.phone}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Delete Address"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
