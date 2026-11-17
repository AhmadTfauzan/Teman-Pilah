import React from 'react';

export default function LoadingBatchDetail() {
  return (
    <div className="min-h-screen bg-[#F8F6F1] pt-16 md:pt-20 pb-12 sm:pb-20 px-3 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 animate-pulse">
        {/* Back button skeleton */}
        <div className="h-9 w-44 bg-stone-200 rounded-xl" />

        {/* Main card skeleton */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-stone-200 shadow-sm space-y-3 sm:space-y-4">
          <div className="flex gap-2">
            <div className="h-6 w-28 bg-stone-200 rounded-lg" />
            <div className="h-6 w-24 bg-stone-200 rounded-full" />
          </div>
          <div className="h-8 w-3/4 bg-stone-200 rounded-xl" />
          <div className="h-4 w-1/2 bg-stone-100 rounded" />
          <div className="h-24 sm:h-28 bg-stone-100 rounded-2xl mt-4" />
        </div>

        {/* Info grid skeleton */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 h-28" />
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 h-28" />
        </div>

        {/* Ingredients skeleton */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-stone-200 space-y-3">
          <div className="h-5 w-48 bg-stone-200 rounded" />
          <div className="flex flex-wrap gap-2 pt-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-8 w-24 bg-stone-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
