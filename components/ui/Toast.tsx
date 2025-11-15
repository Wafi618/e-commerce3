import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  X,
} from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}

const icons = {
  success: <CheckCircle className="text-green-500" />,
  error: <XCircle className="text-red-500" />,
  info: <Info className="text-blue-500" />,
  warning: <AlertTriangle className="text-yellow-500" />,
};

const bgColors = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
  warning: 'bg-yellow-50 border-yellow-200',
};

const textColors = {
  success: 'text-green-800',
  error: 'text-red-800',
  info: 'text-blue-800',
  warning: 'text-yellow-800',
};

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300); // Wait for animation to finish
    }, 4700); // 300ms before auto-close

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`relative w-full max-w-sm rounded-lg shadow-lg p-4 border ${
        bgColors[type]
      } ${
        isExiting ? 'animate-toast-exit' : 'animate-toast-enter'
      } overflow-hidden`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
        <div className={`flex-1 text-sm font-medium ${textColors[type]}`}>
          {message}
        </div>
        <button
          onClick={handleClose}
          className={`text-gray-400 hover:text-gray-600 ${textColors[type]}`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
