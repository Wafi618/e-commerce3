import React, { useState, useEffect } from 'react';
import { useCart, useTheme } from '@/contexts';
import { Check } from 'lucide-react';

export const AddressModal: React.FC = () => {
  // Consume contexts directly
  const {
    addressData,
    setAddressData,
    setShowAddressModal,
    proceedToPayment,
    handleManualPaymentSubmit,
    checkoutLoading,
    cartTotal,
  } = useCart();

  const { darkMode } = useTheme(); // Get dark mode state

  // State for new manual payment fields
  const [bkashNumber, setBkashNumber] = useState('');
  const [trxId, setTrxId] = useState('');

  // Saved addresses state
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
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const res = await fetch('/api/profile/addresses');
        const data = await res.json();
        if (data.success) {
          setSavedAddresses(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch addresses', error);
      }
    };
    fetchAddresses();
  }, []);

  const handleAddressSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    const addr = savedAddresses.find((a) => a.id === selectedId);
    if (addr) {
      setAddressData({
        ...addressData,
        phone: addr.phone,
        city: addr.city,
        country: addr.country,
        address: addr.address,
        house: addr.house || '',
        floor: addr.floor || '',
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div
        className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          } rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto`}
      >
        <h3 className="text-xl font-bold mb-2">
          Delivery Information | ডেলিভারি তথ্য
        </h3>
        <p
          className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'
            } mb-4`}
        >
          Address details are from your profile. To change them,{' '}
          <a
            href="/profile"
            onClick={() => setShowAddressModal(false)}
            className="text-blue-600 hover:text-blue-800 underline font-medium"
          >
            go to profile
          </a>{' '}
          to update your information.
        </p>

        {savedAddresses.length > 0 && (
          <div className="mb-6">
            <label
              className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                } mb-1`}
            >
              Select a Saved Address | সংরক্ষিত ঠিকানা নির্বাচন করুন
            </label>
            <select
              onChange={handleAddressSelect}
              className={`w-full px-3 py-2 border rounded-lg ${darkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
                }`}
            >
              <option value="">-- Select Address --</option>
              {savedAddresses.map((addr) => (
                <option key={addr.id} value={addr.id}>
                  {addr.label} - {addr.address}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-4">
          {/* Phone */}
          <div>
            <label
              className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                } mb-1`}
            >
              Phone Number * | ফোন নম্বর *
            </label>
            <input
              type="tel"
              value={addressData.phone}
              readOnly
              className={`w-full px-3 py-2 border rounded-lg ${darkMode
                  ? 'border-gray-600 bg-gray-700 text-gray-400'
                  : 'border-gray-300 bg-gray-100 text-gray-600'
                }`}
              placeholder="+880 1234 567890"
            />
          </div>

          {/* City */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                  } mb-1`}
              >
                City * | শহর *
              </label>
              <input
                type="text"
                value={addressData.city}
                readOnly
                className={`w-full px-3 py-2 border rounded-lg ${darkMode
                    ? 'border-gray-600 bg-gray-700 text-gray-400'
                    : 'border-gray-300 bg-gray-100 text-gray-600'
                  }`}
                placeholder="Dhaka"
              />
            </div>

            {/* Country */}
            <div>
              <label
                className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                  } mb-1`}
              >
                Country | দেশ
              </label>
              <input
                type="text"
                value={addressData.country}
                readOnly
                className={`w-full px-3 py-2 border rounded-lg ${darkMode
                    ? 'border-gray-600 bg-gray-700 text-gray-400'
                    : 'border-gray-300 bg-gray-100 text-gray-600'
                  }`}
                placeholder="Bangladesh"
              />
            </div>
          </div>

          {/* Road Address */}
          <div>
            <label
              className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                } mb-1`}
            >
              Street Address * | রাস্তার ঠিকানা *
            </label>
            <input
              type="text"
              value={addressData.address}
              readOnly
              className={`w-full px-3 py-2 border rounded-lg ${darkMode
                  ? 'border-gray-600 bg-gray-700 text-gray-400'
                  : 'border-gray-300 bg-gray-100 text-gray-600'
                }`}
              placeholder="Road 12, Banani"
            />
          </div>

          {/* House and Floor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                  } mb-1`}
              >
                House/Building | বাড়ি/ভবন
              </label>
              <input
                type="text"
                value={addressData.house}
                readOnly
                className={`w-full px-3 py-2 border rounded-lg ${darkMode
                    ? 'border-gray-600 bg-gray-700 text-gray-400'
                    : 'border-gray-300 bg-gray-100 text-gray-600'
                  }`}
                placeholder="House #25"
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                  } mb-1`}
              >
                Floor/Unit | তলা/ইউনিট
              </label>
              <input
                type="text"
                value={addressData.floor}
                readOnly
                className={`w-full px-3 py-2 border rounded-lg ${darkMode
                    ? 'border-gray-600 bg-gray-700 text-gray-400'
                    : 'border-gray-300 bg-gray-100 text-gray-600'
                  }`}
                placeholder="3rd Floor, Apt 5B"
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label
              className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                } mb-1`}
            >
              Additional Notes | অতিরিক্ত তথ্য
            </label>
            <textarea
              value={addressData.notes}
              onChange={(e) =>
                setAddressData({ ...addressData, notes: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${darkMode
                  ? 'bg-gray-700 border-gray-600'
                  : 'border-gray-300 bg-white'
                }`}
              placeholder="Delivery instructions, landmarks, etc."
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowAddressModal(false)}
              className={`flex-1 px-4 py-2 border rounded-lg ${darkMode
                  ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                  : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
            >
              Cancel | বাতিল
            </button>
            <button
              type="button"
              onClick={() => { }} // No action, it's disabled
              disabled={true}
              title="Automated checkout is temporarily under construction"
              className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg opacity-50 cursor-not-allowed flex items-center justify-center"
            >
              Proceed to Payment (Under Construction)
            </button>
          </div>

          {/* --- MANUAL PAYMENT SECTION --- */}
          <div
            className={`mt-6 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'
              } pt-6`}
          >
            <h4 className="text-lg font-bold mb-3">
              Manual bKash Payment | ম্যানুয়াল বিকাশ পেমেন্ট
            </h4>
            <div
              className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'
                } border ${darkMode ? 'border-gray-600' : 'border-blue-200'}`}
            >
              <p
                className={`text-sm ${darkMode ? 'text-gray-200' : 'text-blue-800'
                  } space-y-1`}
              >
                <span>
                  1. Use your bKash app's <strong>"Send Money"</strong> feature.
                </span>
                <br />
                <span>
                  2. Send the exact amount:{' '}
                  <strong className="text-lg">
                    ৳{Number(cartTotal).toFixed(2)}
                  </strong>
                </span>
                <br />
                <span>
                  3. Send to this bKash Number:{' '}
                  <strong className="text-lg">01752983864</strong>
                </span>
                <br />
                <span>
                  4. Enter your bKash number and the Transaction ID (TrxID)
                  below and click "Confirm Payment".
                </span>
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label
                  className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                    } mb-1`}
                >
                  Your bKash Number * | আপনার বিকাশ নম্বর *
                </label>
                <input
                  type="tel"
                  value={bkashNumber}
                  onChange={(e) => setBkashNumber(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${darkMode
                      ? 'bg-gray-700 border-gray-600'
                      : 'border-gray-300 bg-white'
                    }`}
                  placeholder="01XXXXXXXXX"
                  required
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'
                    } mb-1`}
                >
                  bKash Transaction ID (TrxID) * | বিকাশ ট্রানজ্যাকশন আইডি *
                </label>
                <input
                  type="text"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${darkMode
                      ? 'bg-gray-700 border-gray-600'
                      : 'border-gray-300 bg-white'
                    }`}
                  placeholder="e.g., 9M7G4P5T8K"
                  required
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleManualPaymentSubmit(bkashNumber, trxId)}
              disabled={
                checkoutLoading || !bkashNumber.trim() || !trxId.trim()
              }
              className="w-full mt-4 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {checkoutLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Confirm Payment | আমি টাকা পাঠিয়েছি
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};