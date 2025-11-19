import React from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import { Toast } from './Toast';

export const ToastContainer: React.FC = () => {
  const { toasts, removeNotification } = useNotification();

  const handleClose = (id: string) => {
    removeNotification(id);
  };

  return (
    <div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => handleClose(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};
