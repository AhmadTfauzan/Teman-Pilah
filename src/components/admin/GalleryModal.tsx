'use client';

import React, { useState, useRef } from 'react';
import { Gallery } from '@/types';
import { getGalleryImageUrl } from '@/lib/api/gallery';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { ConfirmModal } from '@/components/admin/ConfirmModal';

interface GalleryModalProps {
  item: Gallery | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void | Promise<void>;
}

export function GalleryModal({ item, isOpen, onClose, onSubmit }: GalleryModalProps) {
  if (!isOpen) return null;

  return (
    <GalleryModalContent
      key={item?.id ?? 'new'}
      item={item}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function GalleryModalContent({
  item,
  onClose,
  onSubmit,
}: Omit<GalleryModalProps, 'isOpen'>) {
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(() =>
    item ? getGalleryImageUrl(item.image) : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    status: 'PUBLISHED' | 'DRAFT' | 'ERROR' | 'ERROR_FILE_SIZE' | null;
  }>({ isOpen: false, status: null });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setConfirmModal({ isOpen: true, status: 'ERROR_FILE_SIZE' });
        e.target.value = ''; // Clear selection
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Check if new item has an image
    if (!item && !imageFile) {
      setConfirmModal({ isOpen: true, status: 'ERROR' });
      return;
    }

    setConfirmModal({ isOpen: true, status: 'PUBLISHED' });
  };

  const executeSubmit = async () => {
    if (isSubmitting) return;
    setConfirmModal({ isOpen: false, status: null });
    setIsSubmitting(true);

    try {
      const data = new FormData();
      data.append('title', title);
      data.append('description', description);

      if (imageFile) {
        data.append('image', imageFile);
      }

      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#F9FAF8] overflow-hidden animate-slide-up">
      {/* HEADER BAR */}
      <div className="flex-none px-4 sm:px-12 py-4 sm:py-6">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex items-center text-xs sm:text-[13px] font-medium text-[#72796E] hover:text-[#2A3426] transition-colors disabled:opacity-50"
        >
          <ArrowLeft size={16} className="mr-1.5 sm:mr-2" />
          Kembali ke Kelola Galeri
        </button>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2A3426] mt-3 sm:mt-6">
          {item ? 'Edit Item Galeri' : 'Tambah Item Galeri Baru'}
        </h1>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-12 pb-24 sm:pb-32">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* LEFT COLUMN (Forms) */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* Judul Galeri */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[20px] border border-[#F0F2EB] shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs sm:text-[13px] font-bold text-[#72796E]">Judul Galeri</label>
                <span className="text-[11px] text-[#A1A89A]">{title.length}/100</span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                placeholder="Contoh: Kunjungan Mahasiswa Telkom, Sosialisasi Zero Waste..."
                className="w-full border border-[#D6D9D2] rounded-xl p-3 sm:p-4 text-sm text-[#2A3426] focus:outline-none focus:border-[#27532B] transition-all bg-[#F9FAF8] placeholder:text-[#A1A89A]"
              />
            </div>

            {/* Description */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[20px] border border-[#F0F2EB] shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs sm:text-[13px] font-bold text-[#72796E]">Deskripsi</label>
                <span className="text-[11px] text-[#A1A89A]">{description.length}/500</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                placeholder="Tulis deskripsi atau catatan singkat untuk aksi nyata ini..."
                rows={4}
                className="w-full border border-[#D6D9D2] rounded-xl p-3 sm:p-4 text-sm text-[#2A3426] focus:outline-none focus:border-[#27532B] transition-all bg-[#F9FAF8] placeholder:text-[#A1A89A] resize-none"
              />
            </div>
            
          </div>

          {/* RIGHT COLUMN (Image Upload) */}
          <div className="space-y-4 sm:space-y-6">
            
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[20px] border border-[#F0F2EB] shadow-sm space-y-3 sm:space-y-4">
              <label className="text-xs sm:text-[13px] font-bold text-[#72796E]">Foto Galeri</label>
              
              <div
                onClick={() => {
                  if (!isSubmitting) fileInputRef.current?.click();
                }}
                className={`border-2 border-dashed rounded-[20px] aspect-square flex flex-col items-center justify-center p-4 cursor-pointer transition-all duration-300 ${
                  imagePreview
                    ? 'border-[#27532B]/30 bg-[#27532B]/5'
                    : 'border-[#D6D9D2] hover:border-[#27532B]/50 hover:bg-gray-50'
                }`}
              >
                {imagePreview ? (
                  <div className="relative w-full h-full rounded-lg overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-[12px] font-semibold bg-[#27532B] px-3 py-1.5 rounded-full">
                        Ubah Gambar
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-2.5">
                    <div className="inline-flex p-3 rounded-full bg-gray-50 text-gray-400">
                      <ImageIcon size={24} />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-[#42493E]">Unggah Gambar</p>
                      <p className="text-[11px] text-[#A1A89A] mt-1">PNG, JPG, atau JPEG (Maks. 2MB)</p>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

          </div>

        </div>
      </div>

      {/* FOOTER ACTION BAR */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#F9FAF8] border-t border-[#F0F2EB] px-4 sm:px-12 py-3.5 sm:py-5 flex justify-end gap-2.5 sm:gap-3 z-10">
        <button
          onClick={onClose}
          type="button"
          disabled={isSubmitting}
          className="rounded-xl border border-[#D6D9D2] bg-white px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-[13px] font-bold text-[#72796E] hover:bg-gray-50 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Batal
        </button>
        <button
          onClick={handlePreSubmit}
          type="button"
          disabled={isSubmitting}
          className="rounded-xl bg-[#27532B] px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-[13px] font-bold text-white hover:brightness-110 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? 'Menyimpan...'
            : item
            ? 'Simpan Perubahan'
            : 'Unggah Item Galeri'}
        </button>
      </div>

      {/* MODAL DIALOGS */}
      <ConfirmModal
        isOpen={confirmModal.isOpen && confirmModal.status === 'ERROR'}
        onClose={() => setConfirmModal({ isOpen: false, status: null })}
        onConfirm={() => setConfirmModal({ isOpen: false, status: null })}
        title="Form Error"
        message="Mohon pilih gambar untuk item galeri baru."
        confirmText="OK"
        isAlert={true}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen && confirmModal.status === 'ERROR_FILE_SIZE'}
        onClose={() => setConfirmModal({ isOpen: false, status: null })}
        onConfirm={() => setConfirmModal({ isOpen: false, status: null })}
        title="File Terlalu Besar"
        message="Ukuran file gambar tidak boleh melebihi 2MB."
        confirmText="OK"
        isAlert={true}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen && confirmModal.status === 'PUBLISHED'}
        onClose={() => setConfirmModal({ isOpen: false, status: null })}
        onConfirm={() => {
          void executeSubmit();
        }}
        title={item ? 'Perbarui Item Galeri?' : 'Upload Item Galeri?'}
        message={
          item
            ? 'Apakah Anda yakin ingin menyimpan perubahan pada item galeri ini?'
            : 'Apakah Anda yakin ingin mengupload gambar baru ke galeri aksi nyata?'
        }
        confirmText={item ? 'Ya, Perbarui' : 'Ya, Upload'}
        confirmColor="#27532B"
      />
    </div>
  );
}
