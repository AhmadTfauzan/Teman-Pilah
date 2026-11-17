'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BankSampahVideoItem, VideoPlatform } from '@/types';
import { getVideoThumbnailUrl } from '@/lib/api/video';
import { ArrowLeft, Play, Upload, ExternalLink, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface VideoModalProps {
  item: BankSampahVideoItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
}

export function VideoModal({ item, isOpen, onClose, onSubmit }: VideoModalProps) {
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [platform, setPlatform] = useState<VideoPlatform>('YouTube');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [aspect, setAspect] = useState<'wide' | 'tall'>('wide');
  const [sortOrder, setSortOrder] = useState<number>(0);

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [customThumbnailUrl, setCustomThumbnailUrl] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper untuk deteksi platform & YouTube ID
  const detectPlatformFromUrl = (url: string): VideoPlatform | null => {
    const lower = url.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube';
    if (lower.includes('tiktok.com')) return 'TikTok';
    if (lower.includes('instagram.com')) return 'Instagram';
    return null;
  };

  const extractYouTubeId = (url: string): string | null => {
    const match = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
    );
    return match ? match[1] : null;
  };

  useEffect(() => {
    if (!isOpen) return;

    if (item) {
      setTitle(item.title || '');
      setVideoUrl(item.videoUrl || '');
      setPlatform(item.platform || 'YouTube');
      setDuration(item.duration || '');
      setDescription(item.description || '');
      setCategory(item.category || '');
      setAspect((item.aspect as any) === 'tall' ? 'tall' : 'wide');
      setSortOrder(item.sortOrder ?? 0);
      setThumbnailPreview(item.thumbnail ? getVideoThumbnailUrl(item.thumbnail) : '');
      setCustomThumbnailUrl(item.thumbnail && item.thumbnail.startsWith('http') ? item.thumbnail : '');
      setThumbnailFile(null);
    } else {
      setTitle('');
      setVideoUrl('');
      setPlatform('YouTube');
      setDuration('');
      setDescription('');
      setCategory('Penimbangan');
      setAspect('wide');
      setSortOrder(0);
      setThumbnailPreview('');
      setCustomThumbnailUrl('');
      setThumbnailFile(null);
    }
    setErrorMessage('');
  }, [item, isOpen]);

  // Auto-detect platform and YouTube thumbnail saat link video berubah
  const handleUrlChange = (newUrl: string) => {
    setVideoUrl(newUrl);

    const detected = detectPlatformFromUrl(newUrl);
    if (detected) {
      setPlatform(detected);
      if (detected === 'YouTube') {
        setAspect('wide');
        const ytId = extractYouTubeId(newUrl);
        if (ytId && !thumbnailFile) {
          const autoYtThumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
          setThumbnailPreview(autoYtThumb);
          setCustomThumbnailUrl(autoYtThumb);
        }
      } else {
        setAspect('tall');
      }
    }
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Ukuran file gambar maksimal 2MB');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMessage('Judul video wajib diisi.');
      return;
    }

    if (!videoUrl.trim()) {
      setErrorMessage('Link video sosmed wajib diisi.');
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
    formData.append('sortOrder', String(sortOrder));

    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    } else if (customThumbnailUrl) {
      formData.append('thumbnail', customThumbnailUrl);
    }

    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-2 sm:p-6 lg:p-8 flex items-center justify-center animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[94vh]">
        {/* Header Modal */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#012D1D] to-[#0B4A31] text-white">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
              title="Kembali"
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            </button>
            <h2 className="font-['Poppins'] font-bold text-base sm:text-2xl">
              {item ? 'Edit Video Bank Sampah' : 'Tambah Video Bank Sampah Baru'}
            </h2>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-8 flex-1 space-y-4 sm:space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Inputs */}
            <div className="lg:col-span-7 space-y-5">
              {/* Link Video Sosmed */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 font-['Poppins']">
                  Link Video Sosmed <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="Contoh: https://www.youtube.com/watch?v=... atau https://www.tiktok.com/@temanpilah"
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-[#3B9734] focus:outline-none focus:ring-2 focus:ring-[#3B9734]/20 transition-all font-mono"
                  />
                  {videoUrl && (
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#3B9734]"
                      title="Buka link"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mendukung link dari <strong>YouTube</strong>, <strong>Instagram</strong>, dan <strong>TikTok</strong>.
                </p>
              </div>

              {/* Platform Selector */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 font-['Poppins']">
                  Platform Sosmed
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['YouTube', 'Instagram', 'TikTok'] as VideoPlatform[]).map((p) => {
                    const isSelected = platform === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setPlatform(p);
                          if (p === 'YouTube') setAspect('wide');
                          else setAspect('tall');
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? p === 'YouTube'
                              ? 'bg-red-600 text-white border-red-600 shadow-md'
                              : p === 'Instagram'
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-md'
                              : 'bg-black text-white border-black shadow-md'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <span>{p}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Judul Video */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-bold text-gray-700 font-['Poppins']">
                    Judul Video <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-gray-400">{title.length}/255</span>
                </div>
                <input
                  type="text"
                  value={title}
                  maxLength={255}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Penimbangan Rutin Bank Sampah Mandiri & Tukar Tabungan"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-[#3B9734] focus:outline-none focus:ring-2 focus:ring-[#3B9734]/20 transition-all font-['Poppins']"
                />
              </div>

              {/* Kategori & Durasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 font-['Poppins']">
                    Kategori / Topik
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Contoh: Penimbangan, Tips & Trik, Daur Ulang"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-[#3B9734] focus:outline-none focus:ring-2 focus:ring-[#3B9734]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 font-['Poppins']">
                    Durasi Video (Opsional)
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Contoh: 3:45 atau 0:58"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-[#3B9734] focus:outline-none focus:ring-2 focus:ring-[#3B9734]/20 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Format Tampilan & Urutan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 font-['Poppins']">
                    Rasio Tampilan
                  </label>
                  <select
                    value={aspect}
                    onChange={(e) => setAspect(e.target.value as any)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-[#3B9734] focus:outline-none focus:ring-2 focus:ring-[#3B9734]/20 transition-all bg-white"
                  >
                    <option value="wide">Landscape 16:9 (YouTube standard)</option>
                    <option value="tall">Portrait 9:16 (Shorts, Reels, TikTok)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5 font-['Poppins']">
                    Nomor Urut Tampil
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    min={0}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-[#3B9734] focus:outline-none focus:ring-2 focus:ring-[#3B9734]/20 transition-all"
                  />
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-bold text-gray-700 font-['Poppins']">
                    Deskripsi / Catatan Kegiatan
                  </label>
                  <span className="text-xs text-gray-400">{description.length}/1000</span>
                </div>
                <textarea
                  value={description}
                  maxLength={1000}
                  rows={3}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tulis ringkasan kegiatan atau informasi yang dibahas dalam video ini..."
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:border-[#3B9734] focus:outline-none focus:ring-2 focus:ring-[#3B9734]/20 transition-all resize-none"
                />
              </div>
            </div>

            {/* Right Column: Thumbnail & Live Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 font-['Poppins']">
                  Foto / Thumbnail Video
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group border-2 border-dashed border-gray-300 hover:border-[#3B9734] rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all bg-[#F8FAF8] hover:bg-white overflow-hidden min-h-[220px]"
                >
                  {thumbnailPreview ? (
                    <div className="relative w-full h-44 rounded-xl overflow-hidden">
                      <Image
                        src={thumbnailPreview}
                        alt="Preview Thumbnail"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1.5">
                        <Upload size={16} />
                        <span>Ganti Gambar</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 text-[#012D1D] flex items-center justify-center mb-3">
                        <ImageIcon size={24} />
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-gray-700">
                        Klik untuk upload foto thumbnail
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG, atau WEBP (Maks. 2MB). Jika link YouTube diisi, thumbnail akan otomatis terdeteksi.
                      </p>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleThumbnailFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2 font-['Poppins']">
                  Pratinjau Kartu Video
                </span>

                <div className="relative rounded-xl overflow-hidden bg-[#012D1D] text-white border border-[#0B4A31] aspect-[16/10] shadow-sm">
                  {thumbnailPreview ? (
                    <Image
                      src={thumbnailPreview}
                      alt="Thumbnail"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#012D1D] flex items-center justify-center">
                      <Play size={28} className="text-white/40" />
                    </div>
                  )}

                  {/* Dark gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />

                  {/* Platform badge */}
                  <div className="absolute top-2.5 left-2.5 rounded bg-white px-2 py-0.5 text-[11px] font-bold text-black shadow-sm">
                    {platform}
                  </div>

                  {/* Duration badge */}
                  {duration && (
                    <div className="absolute top-2.5 right-2.5 rounded bg-black/70 px-2 py-0.5 text-[10px] font-mono text-white">
                      {duration}
                    </div>
                  )}

                  {/* Center Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full bg-[#FC9634] flex items-center justify-center text-[#012D1D]">
                      <Play size={18} className="fill-[#012D1D] ml-0.5" />
                    </div>
                  </div>

                  {/* Bottom title */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-xs font-bold line-clamp-1 font-['Poppins'] text-white">
                      {title || 'Judul Video Bank Sampah'}
                    </p>
                    <span className="text-[10px] text-[#C9D6CF]">
                      Tonton di {platform}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#012D1D] hover:bg-[#0B4A31] text-white text-sm font-bold shadow-lg shadow-[#012D1D]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {item ? 'Simpan Perubahan' : 'Tambah Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

