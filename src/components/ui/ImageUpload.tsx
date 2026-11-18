'use client';

import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB (matches backend upload limit)

interface ImageUploadProps {
  value?: string;
  onChange: (value: string, file?: File) => void;
  label?: string;
  className?: string;
}

export function ImageUpload({ value, onChange, label, className }: ImageUploadProps) {
  const [localPreview, setLocalPreview] = useState<{
    forValue: string | undefined;
    url: string;
  } | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPreview =
    localPreview && localPreview.forValue === value ? localPreview.url : value;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setSizeError('Ukuran file maksimal 2MB. Silakan pilih gambar yang lebih kecil.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSizeError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setLocalPreview({ forValue: value, url: result });
      onChange(result, file);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setSizeError(null);
    setLocalPreview({ forValue: value, url: '' });
    onChange('', undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && <label className="text-sm font-medium text-primary block">{label}</label>}
      <div
        className={cn(
          'relative group border-2 border-dashed border-border rounded-2xl overflow-hidden bg-bg/20 transition-all hover:border-primary/50',
          currentPreview ? 'aspect-video' : 'py-10'
        )}
      >
        {currentPreview ? (
          <>
            <img src={currentPreview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                aria-label="Hapus gambar"
                onClick={handleRemove}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-red-500 hover:scale-110 transition-transform"
              >
                <X size={20} />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 text-neutral hover:text-primary transition-colors"
          >
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Upload size={20} />
            </div>
            <div className="text-center">
              <p className="font-medium">Klik untuk upload gambar</p>
              <p className="text-xs opacity-70">PNG, JPG up to 2MB</p>
            </div>
          </button>
        )}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
      {sizeError && (
        <p role="alert" className="text-xs text-red-500 mt-1">
          {sizeError}
        </p>
      )}
    </div>
  );
}
