'use client';

import React, { useState } from 'react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  itemName?: string;
  confirmText?: string;
  description?: string;
  variant?: 'danger' | 'warning';
  isDeleting?: boolean;
  isLoading?: boolean;
}

export function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Hapus Program?",
  itemName = "",
  confirmText = "Hapus Program",
  description,
  variant = 'danger',
  isDeleting = false,
  isLoading = false,
}: DeleteModalProps) {
  const [internalSubmitting, setInternalSubmitting] = useState(false);

  if (!isOpen) return null;

  const isWarning = variant === 'warning';
  const isBusy = Boolean(isDeleting || isLoading || internalSubmitting);

  const handleConfirm = async () => {
    if (isBusy) return;
    setInternalSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setInternalSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-sm transition-all duration-300">
      <div className="animate-pop w-[420px] max-w-[92vw] overflow-hidden rounded-2xl sm:rounded-[24px] bg-white shadow-xl flex flex-col">
        {/* CONTENT */}
        <div className="flex flex-col items-center px-5 sm:px-8 pb-5 sm:pb-6 pt-6 sm:pt-8 text-center">
          <div className={`mb-3 sm:mb-4 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full ${isWarning ? 'bg-amber-50 text-amber-600' : 'bg-[#fef2f2] text-[#dc2626]'}`}>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h3 className="mb-1.5 sm:mb-2 text-base sm:text-[18px] font-bold text-[#1a1c19]">{title}</h3>
          <div className="text-xs sm:text-[13px] leading-relaxed text-[#72796E]">
            {description ? (
              <p>{description}</p>
            ) : (
              <p>
                Apakah Anda yakin ingin menghapus &ldquo;{itemName}&rdquo;? Tindakan ini tidak dapat dibatalkan.
              </p>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 bg-[#F9FAF8] px-5 sm:px-8 py-4 sm:py-5">
          <button
            onClick={onClose}
            disabled={isBusy}
            type="button"
            className="flex-1 rounded-xl border border-[#D6D9D2] bg-white px-4 py-2.5 text-[13px] font-medium text-[#72796E] transition-all duration-200 hover:bg-gray-50 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={isBusy}
            type="button"
            className="flex-1 rounded-xl bg-[#c21c1c] px-4 py-2.5 text-[13px] font-medium text-white shadow-sm transition-all duration-200 hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isBusy ? 'Memproses...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
