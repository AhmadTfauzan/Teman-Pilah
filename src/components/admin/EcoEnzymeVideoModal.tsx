'use client';

import React, { useState, useRef } from 'react';
import { EcoEnzymeVideoItem, EcoEnzymeVideoPlatform } from '@/types';
import { getEcoEnzymeVideoThumbnailUrl } from '@/lib/api/eco-enzyme-video';
import { X, Upload, Image as ImageIcon, Film } from 'lucide-react';

interface EcoEnzymeVideoModalProps {
  item: EcoEnzymeVideoItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void | Promise<void>;
}

export function EcoEnzymeVideoModal({
  item,
  isOpen,
  onClose,
  onSubmit,
}: EcoEnzymeVideoModalProps) {
  if (!isOpen) return null;

  return (
    <EcoEnzymeVideoModalContent
      key={item?.id ?? 'new'}
      item={item}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function EcoEnzymeVideoModalContent({
  item,
  onClose,
  onSubmit,
}: Omit<EcoEnzymeVideoModalProps, 'isOpen'>) {
  const [title, setTitle] = useState(item?.title || '');
  const [videoUrl, setVideoUrl] = useState(item?.videoUrl || '');
  const [platform, setPlatform] = useState<EcoEnzymeVideoPlatform>(
    item?.platform || 'Local'
  );
  const [duration, setDuration] = useState(item?.duration || '');
  const [description, setDescription] = useState(item?.description || '');
  const [category, setCategory] = useState(
    item ? item.category || '' : 'Manfaat & Khasiat'
  );
  const [aspect, setAspect] = useState<'wide' | 'tall'>(
    item?.aspect === 'wide' ? 'wide' : 'tall'
  );
  const [tagsInput, setTagsInput] = useState(item?.tags?.join(', ') || '');
  const [isActive, setIsActive] = useState<boolean>(item?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState<number>(item?.sortOrder ?? 0);

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>(() =>
    item?.thumbnail ? getEcoEnzymeVideoThumbnailUrl(item.thumbnail) : ''
  );
  const [customThumbnailUrl, setCustomThumbnailUrl] = useState(
    item?.thumbnail && item.thumbnail.startsWith('http') ? item.thumbnail : ''
  );

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper deteksi platform & YouTube ID
  const detectPlatformFromUrl = (url: string): EcoEnzymeVideoPlatform | null => {
    const lower = url.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube';
    if (lower.includes('tiktok.com')) return 'TikTok';
    if (lower.includes('instagram.com')) return 'Instagram';
    if (lower.startsWith('/') || lower.endsWith('.mp4') || lower.endsWith('.webm')) return 'Local';
    return null;
  };

  const extractYouTubeId = (url: string): string | null => {
    const match = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
    );
    return match ? match[1] : null;
  };

  const handleUrlChange = (newUrl: string) => {
    setVideoUrl(newUrl);

    const detected = detectPlatformFromUrl(newUrl);
    if (detected) {
      setPlatform(detected);
      if (detected === 'YouTube') {
        const ytId = extractYouTubeId(newUrl);
        if (ytId && !thumbnailFile) {
          const autoYtThumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
          setThumbnailPreview(autoYtThumb);
          setCustomThumbnailUrl(autoYtThumb);
        }
      }
    }
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Ukuran file gambar thumbnail maksimal 2MB');
        e.target.value = '';
        return;
      }
      setErrorMessage('');
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!title.trim()) {
      setErrorMessage('Judul video edukasi wajib diisi.');
      return;
    }

    if (!videoUrl.trim()) {
      setErrorMessage('Link atau path video wajib diisi.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('videoUrl', videoUrl.trim());
    formData.append('platform', platform);
    formData.append('duration', duration.trim());
    formData.append('description', description.trim());
    formData.append('category', category.trim());
    formData.append('aspect', aspect);
    formData.append('tags', tagsInput);
    formData.append('isActive', String(isActive));
    formData.append('sortOrder', String(sortOrder));

    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    } else if (customThumbnailUrl) {
      formData.append('thumbnail', customThumbnailUrl);
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch {
      // Parent handles error toast and keeps modal open
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-2 sm:my-8 max-h-[92vh] flex flex-col">
        {/* Header Modal */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0">
              <Film className="w-4 h-4 sm:w-5 sm:h-5 text-[#2C5F2D]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight truncate">
                {item ? 'Edit Video Edukasi Eco Enzyme' : 'Tambah Video Edukasi Eco Enzyme'}
              </h2>
              <p className="text-[11px] sm:text-xs text-stone-500 truncate">
                Kelola video panduan manfaat atau cara pembuatan Eco Enzyme.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              {errorMessage}
            </div>
          )}

          {/* Judul Video */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">
              Judul Video <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="cth: VIDIO MANFAAT ECO ENZYM"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all font-medium text-stone-900 placeholder:text-stone-400"
              required
            />
          </div>

          {/* Link / URL Video */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-700">
                Link Video / Path MP4 <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-stone-400">
                YouTube, TikTok, Instagram, atau /videos/file.mp4
              </span>
            </div>
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="cth: /videos/vidio-manfaat-eco-enzym.mp4 atau https://youtu.be/..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all font-mono text-stone-800 placeholder:text-stone-400"
              required
            />
          </div>

          {/* Platform & Rasio Aspek */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Platform Video</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as EcoEnzymeVideoPlatform)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all font-medium text-stone-900"
              >
                <option value="Local">Video Lokal (File MP4 di server)</option>
                <option value="YouTube">YouTube</option>
                <option value="TikTok">TikTok</option>
                <option value="Instagram">Instagram Reels</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Rasio Aspek Player</label>
              <select
                value={aspect}
                onChange={(e) => setAspect(e.target.value as 'wide' | 'tall')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all font-medium text-stone-900"
              >
                <option value="tall">Vertikal / Reels (9:16 atau 9:13 - Rekomendasi)</option>
                <option value="wide">Horizontal / Standar (16:9)</option>
              </select>
            </div>
          </div>

          {/* Kategori, Durasi, Urutan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Kategori / Topik</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="cth: Manfaat & Khasiat"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all text-stone-900 font-medium placeholder:text-stone-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Durasi Video</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="cth: 01:46"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all text-stone-900 font-medium placeholder:text-stone-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700">Nomor Urutan</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                min={0}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all text-stone-900 font-medium"
              />
            </div>
          </div>

          {/* Tags & Visibilitas Publik */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700">
                  Tags / Label (Opsional)
                </label>
                <span className="text-[11px] text-stone-400">Pisahkan dengan koma</span>
              </div>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="cth: Pembersih Alami, Pupuk Organik, Ramah Lingkungan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all text-stone-900 font-medium placeholder:text-stone-400"
              />
            </div>

            <label className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 cursor-pointer">
              <div>
                <span className="block text-xs font-bold text-stone-800">
                  Tampilkan di Halaman Publik
                </span>
                <span className="block text-[11px] text-stone-500">
                  Nonaktifkan jika ingin menyembunyikan video ini dari halaman publik.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-[#012D1D] focus:ring-emerald-500 shrink-0"
              />
            </label>
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700">Deskripsi Singkat Video</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan ringkasan isi video edukasi ini..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all text-stone-900 font-medium placeholder:text-stone-400 resize-none"
            />
          </div>

          {/* Thumbnail Image (Opsional) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700">
              Thumbnail Kustom (Opsional)
            </label>
            <div className="flex items-center gap-4">
              {thumbnailPreview ? (
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 shrink-0 shadow-sm">
                  <img
                    src={thumbnailPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setThumbnailPreview('');
                      setThumbnailFile(null);
                      setCustomThumbnailUrl('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center text-xs hover:bg-black"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-2xl border-2 border-dashed border-stone-300 hover:border-emerald-500 bg-stone-50 flex flex-col items-center justify-center cursor-pointer transition-colors text-stone-400 hover:text-emerald-700 shrink-0"
                >
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-semibold">Pilih Foto</span>
                </div>
              )}

              <div className="flex-1 space-y-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleThumbnailFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Unggah Thumbnail</span>
                </button>
                <p className="text-[11px] text-stone-400">
                  Format JPG, PNG, atau WEBP (Maksimal 2MB). Jika dikosongkan, video lokal akan menampilkan frame awal secara otomatis.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Tombol */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#012D1D] hover:bg-[#0B4A31] text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Menyimpan...' : item ? 'Simpan Perubahan' : 'Tambah Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

