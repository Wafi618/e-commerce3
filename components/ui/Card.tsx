import React from 'react';

interface CardProps {
  children: React.ReactNode;
  darkMode?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, darkMode, className = '' }) => {
  return (
    <div
      className={`${
        darkMode ? 'bg-gray-800' : 'bg-white'
      } rounded-lg shadow ${className}`}
    >
      {children}
    </div>
  );
};
