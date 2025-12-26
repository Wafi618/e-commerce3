import React from 'react';

interface BadgeProps {
  status: 'pending' | 'processing' | 'shipping' | 'completed' | 'cancelled' | 'refund_in_progress' | 'refunded' | 'PENDING' | 'PROCESSING' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED' | 'REFUND_IN_PROGRESS' | 'REFUNDED';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ status, children }) => {
  const statusClasses: Record<string, string> = {
    completed: 'bg-green-100 text-green-800',
    COMPLETED: 'bg-green-100 text-green-800',
    shipping: 'bg-purple-100 text-purple-800',
    SHIPPING: 'bg-purple-100 text-purple-800',
    processing: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    refund_in_progress: 'bg-orange-100 text-orange-800',
    REFUND_IN_PROGRESS: 'bg-orange-100 text-orange-800',
    refunded: 'bg-gray-100 text-gray-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`px-3 py-1 rounded text-sm font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
      {children}
    </span>
  );
};
