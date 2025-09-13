import React from "react";

export const NoteCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-5 bg-gray-200 rounded-full w-16"></div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <div className="h-5 bg-gray-200 rounded w-12"></div>
          <div className="h-5 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  );
};

export const NoteListSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <NoteCardSkeleton key={index} />
      ))}
    </div>
  );
};

export const SearchBarSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6 animate-pulse">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="md:w-48">
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export const NoteDetailSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        <div className="flex items-center space-x-2">
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          <div className="h-6 bg-gray-200 rounded w-12"></div>
          <div className="h-6 bg-gray-200 rounded w-14"></div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <div className="h-6 bg-gray-200 rounded w-16"></div>
        <div className="h-6 bg-gray-200 rounded w-20"></div>
        <div className="h-6 bg-gray-200 rounded w-14"></div>
      </div>

      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="h-4 bg-gray-200 rounded w-full"></div>
        ))}
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  );
};
