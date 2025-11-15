import React, { useState, useEffect } from 'react';
import { UserCircle, Trash2, Unlock, Key, Search } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';

export const CustomersTab: React.FC = () => {
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [showResetModal, setShowResetModal] = useState<any>(null);

  // Search states
  const [searchEmail, setSearchEmail] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const { addNotification, showConfirmation } = useNotification();

  // Admin panel always uses dark mode
  const darkMode = true;

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/users/customers');
        const data = await response.json();
        if (data.success) {
          setCustomers(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch customers:', err);
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, []);

  const deleteCustomer = async (customerId: string) => {
    showConfirmation(
      'Delete Customer',
      'Are you sure you want to permanently delete this customer? This action cannot be undone.',
      async () => {
        try {
          const response = await fetch('/api/users/delete-customer', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ customerId }),
          });

          const data = await response.json();

          if (data.success) {
            setCustomers(customers.filter((c: any) => c.id !== customerId));
            addNotification('Customer deleted successfully', 'success');
          } else {
            addNotification(data.error || 'Failed to delete customer', 'error');
          }
        } catch (err) {
          addNotification('Network error. Failed to delete customer.', 'error');
          console.error('Delete customer error:', err);
        }
      }
    );
  };

  const unlockAccount = async (customerId: string) => {
    try {
      const response = await fetch('/api/admin/unlock-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });

      const data = await response.json();

      if (data.success) {
        addNotification('Account unlocked successfully!', 'success');
        // Refresh customers list
        const refreshResponse = await fetch('/api/users/customers');
        const refreshData = await refreshResponse.json();
        if (refreshData.success) {
          setCustomers(refreshData.data);
        }
      } else {
        addNotification(data.error || 'Failed to unlock account', 'error');
      }
    } catch (err) {
      addNotification('Network error. Failed to unlock account.', 'error');
    }
  };

  const resetPassword = async (customerId: string, newPassword: string) => {
    try {
      const response = await fetch('/api/admin/get-customer-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        addNotification('Password reset successfully!', 'success');
        setShowResetModal(null);
      } else {
        addNotification(data.error || 'Failed to reset password', 'error');
      }
    } catch (err) {
      addNotification('Network error. Failed to reset password.', 'error');
    }
  };

  // Filter customers based on search
  const filteredCustomers = customers.filter((customer: any) => {
    const matchesEmail = !searchEmail || customer.email.toLowerCase().includes(searchEmail.toLowerCase());
    const matchesName = !searchName || (customer.name && customer.name.toLowerCase().includes(searchName.toLowerCase()));
    const matchesPhone = !searchPhone || (customer.phone && customer.phone.includes(searchPhone));
    return matchesEmail && matchesName && matchesPhone;
  });

  return (
    <div>
      <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>Customer Profiles</h2>

      {/* Search Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Search by Email
          </label>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} w-5 h-5`} />
            <input
              type="text"
              placeholder="Enter email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Search by Name
          </label>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} w-5 h-5`} />
            <input
              type="text"
              placeholder="Enter name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Search by Phone
          </label>
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'} w-5 h-5`} />
            <input
              type="text"
              placeholder="Enter phone..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border ${darkMode ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' : 'border-gray-300 bg-white text-gray-900'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
          </div>
        </div>
      </div>

      {loadingCustomers ? (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : customers.length === 0 ? (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-12 text-center`}>
          <UserCircle className={`w-16 h-16 ${darkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
          <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>No customers yet</h3>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Customer profiles will appear here once users register</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-12 text-center`}>
          <UserCircle className={`w-16 h-16 ${darkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
          <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>No customers found</h3>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Try adjusting your search filters</p>
        </div>
      ) : (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
          <table className="w-full">
            <thead className={`${darkMode ? 'bg-gray-700 border-b border-gray-600' : 'bg-gray-50 border-b'}`}>
              <tr>
                <th className={`px-6 py-3 text-left text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Name</th>
                <th className={`px-6 py-3 text-left text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Email</th>
                <th className={`px-6 py-3 text-left text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Phone</th>
                <th className={`px-6 py-3 text-left text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>City</th>
                <th className={`px-6 py-3 text-left text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Country</th>
                <th className={`px-6 py-3 text-left text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Address</th>
                <th className={`px-6 py-3 text-left text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>House/Unit</th>
                <th className={`px-6 py-3 text-left text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Floor</th>
                <th className={`px-6 py-3 text-left text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`${darkMode ? 'divide-y divide-gray-700' : 'divide-y'}`}>
              {filteredCustomers.map((customer: any) => (
                <tr key={customer.id} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <UserCircle className={`w-5 h-5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{customer.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{customer.email}</td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{customer.phone || '-'}</td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{customer.city || '-'}</td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{customer.country || '-'}</td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{customer.address || '-'}</td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{customer.house || '-'}</td>
                  <td className={`px-6 py-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{customer.floor || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {customer.restrictedAccess && (
                        <button
                          onClick={() => unlockAccount(customer.id)}
                          className={`p-2 rounded ${darkMode ? 'text-green-400 hover:bg-gray-600' : 'text-green-600 hover:bg-green-50'}`}
                          title="Unlock restricted account"
                        >
                          <Unlock className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setShowResetModal(customer)}
                        className={`p-2 rounded ${darkMode ? 'text-blue-400 hover:bg-gray-600' : 'text-blue-600 hover:bg-blue-50'}`}
                        title="Reset password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteCustomer(customer.id)}
                        className={`p-2 rounded ${darkMode ? 'text-red-400 hover:bg-gray-600' : 'text-red-600 hover:bg-red-50'}`}
                        title="Delete customer (only if no active orders)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-md w-full p-6`}>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Reset Password</h3>
            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
              Reset password for: <strong>{showResetModal.email}</strong>
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newPassword = formData.get('newPassword') as string;
                if (newPassword) {
                  resetPassword(showResetModal.id, newPassword);
                }
              }}
            >
              <div className="mb-4">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  New Password *
                </label>
                <input
                  type="password"
                  name="newPassword"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
                  placeholder="Enter new password"
                  minLength={6}
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowResetModal(null)}
                  className={`flex-1 px-4 py-2 border rounded-lg ${darkMode ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
