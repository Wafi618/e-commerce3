import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  darkMode?: boolean;
  multiline?: boolean;
  rows?: number;
}

export const Input: React.FC<InputProps> = ({
  label,
  darkMode,
  multiline,
  rows,
  className = '',
  ...props
}) => {
  const inputClasses = `w-full px-3 py-2 border ${
    darkMode
      ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
      : 'border-gray-300 bg-white text-gray-900'
  } rounded-lg focus:ring-2 focus:ring-blue-500 ${className}`;

  const labelClasses = `block text-sm font-medium ${
    darkMode ? 'text-gray-300' : 'text-gray-700'
  } mb-1`;

  return (
    <div>
      {label && <label className={labelClasses}>{label}</label>}
      {multiline ? (
        <textarea
          className={inputClasses}
          rows={rows || 3}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : (
        <input
          className={inputClasses}
          {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
    </div>
  );
};
