import React from 'react';
import { useCart } from '@/contexts';

export const AddressModal: React.FC = () => {
  // Consume contexts directly
  const {
    addressData,
    setAddressData,
    setShowAddressModal,
    proceedToPayment,
    checkoutLoading
  } = useCart();
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Delivery Information | ডেলিভারি তথ্য
        </h3>
        <p className="text-sm text-gray-600 mb-4">
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

        <div className="space-y-4">
          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number * | ফোন নম্বর *
            </label>
            <input
              type="tel"
              value={addressData.phone}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
              placeholder="+880 1234 567890"
            />
          </div>

          {/* City */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City * | শহর *
              </label>
              <input
                type="text"
                value={addressData.city}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                placeholder="Dhaka"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country | দেশ
              </label>
              <input
                type="text"
                value={addressData.country}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                placeholder="Bangladesh"
              />
            </div>
          </div>

          {/* Road Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address * | রাস্তার ঠিকানা *
            </label>
            <input
              type="text"
              value={addressData.address}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
              placeholder="Road 12, Banani"
            />
          </div>

          {/* House and Floor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                House/Building | বাড়ি/ভবন
              </label>
              <input
                type="text"
                value={addressData.house}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                placeholder="House #25"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Floor/Unit | তলা/ইউনিট
              </label>
              <input
                type="text"
                value={addressData.floor}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                placeholder="3rd Floor, Apt 5B"
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes | অতিরিক্ত তথ্য
            </label>
            <textarea
              value={addressData.notes}
              onChange={(e) => setAddressData({ ...addressData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Delivery instructions, landmarks, etc."
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowAddressModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
            >
              Cancel | বাতিল
            </button>
            <button
              type="button"
              onClick={proceedToPayment}
              disabled={checkoutLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
            >
              {checkoutLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Proceed to Payment | পেমেন্টে যান'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
