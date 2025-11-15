import React from 'react';

export const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="h-48 bg-gray-200 skeleton"></div>
      <div className="p-4">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 skeleton"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4 skeleton"></div>
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-1/4 skeleton"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 skeleton"></div>
        </div>
        <div className="flex gap-2 mt-4">
          <div className="h-10 bg-gray-200 rounded w-1/2 skeleton"></div>
          <div className="h-10 bg-gray-200 rounded w-1/2 skeleton"></div>
        </div>
      </div>
    </div>
  );
};
