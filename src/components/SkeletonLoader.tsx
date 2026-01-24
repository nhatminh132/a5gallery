import React from 'react';

export function MediaGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
          <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ImageSkeleton() {
  return (
    <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
  );
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {[...Array(lines)].map((_, i) => (
        <div 
          key={i} 
          className={`h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
}

export function ButtonSkeleton() {
  return (
    <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
  );
}

export function AvatarSkeleton() {
  return (
    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md space-y-3">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
      <TextSkeleton lines={2} />
      <div className="flex gap-2">
        <ButtonSkeleton />
        <ButtonSkeleton />
      </div>
    </div>
  );
}

export default function SkeletonLoader() {
  return <MediaGridSkeleton />;
}
