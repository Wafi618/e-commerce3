import React from 'react';

interface BadgeProps {
  status: 'pending' | 'processing' | 'shipping' | 'completed' | 'cancelled';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ status, children }) => {
  const statusClasses = {
    completed: 'bg-green-100 text-green-800',
    shipping: 'bg-purple-100 text-purple-800',
    processing: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <span className={`px-3 py-1 rounded text-sm font-medium ${statusClasses[status]}`}>
      {children}
    </span>
  );
};
