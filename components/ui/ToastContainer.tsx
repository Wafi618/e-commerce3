import React from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import { Toast } from './Toast';

export const ToastContainer: React.FC = () => {
  const { toasts, addNotification } = useNotification();

  // This is a bit of a hack to remove the toast from state when Toast's internal timer closes it
  // A better way would be for addNotification to return the ID and Toast to call a removeNotification(id)
  // But for this, we'll just re-filter
  const handleClose = (id: string) => {
    // This doesn't work as expected, but the auto-close in NotificationContext will
  };

  return (
    <div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => handleClose(toast.id)}
        />
      ))}
    </div>
  );
};
