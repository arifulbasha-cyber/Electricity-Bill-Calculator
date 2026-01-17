import React from 'react';

const SkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl w-full"></div>
      
      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="space-y-4">
            <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
         </div>
         <div className="space-y-4">
            <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
         </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;