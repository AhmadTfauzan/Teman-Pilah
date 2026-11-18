'use client';

import React, { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { Card } from './Card';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
    >
      <div
        className="absolute inset-0 bg-primary/20 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <Card
        className={cn(
          'w-full max-w-lg relative z-10 animate-pop shadow-2xl overflow-hidden',
          className
        )}
        padding="none"
      >
        <div className="flex items-center justify-between p-6 border-b border-border bg-white">
          <h3 id={titleId} className="text-2xl font-bold text-primary">
            {title}
          </h3>
          <button
            type="button"
            aria-label="Tutup modal"
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-bg flex items-center justify-center text-neutral transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 bg-white overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </Card>
    </div>
  );
}
