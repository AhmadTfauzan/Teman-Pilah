'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BankSampahVideoItem, VideoPlatform } from '@/types';
import { videoApi } from '@/lib/api/video';
import { VideoTable } from '@/components/admin/VideoTable';
import { VideoModal } from '@/components/admin/VideoModal';
import { DeleteModal } from '@/components/admin/DeleteModal';
import { Plus, Search, Video, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<BankSampahVideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'ALL' | VideoPlatform>('ALL');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<BankSampahVideoItem | null>(null);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    video: BankSampahVideoItem | null;
  }>({
    isOpen: false,
    video: null,
  });

  // Success message toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const fetchVideos = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await videoApi.getAll({ limit: 100 });
      setVideos(data);
    } catch (error) {
      console.error('Failed to load videos:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Filtered list
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const matchPlatform = platformFilter === 'ALL' || v.platform === platformFilter;
      const matchSearch =
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (v.category && v.category.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchPlatform && matchSearch;
    });
  }, [videos, platformFilter, searchQuery]);

  // Platform count stats
  const stats = useMemo(() => {
    return {
      all: videos.length,
      youtube: videos.filter((v) => v.platform === 'YouTube').length,
      instagram: videos.filter((v) => v.platform === 'Instagram').length,
      tiktok: videos.filter((v) => v.platform === 'TikTok').length,
    };
  }, [videos]);

  const handleOpenAddModal = () => {
    setSelectedVideo(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (video: BankSampahVideoItem) => {
    setSelectedVideo(video);
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (formData: FormData) => {
    try {
      if (selectedVideo) {
        await videoApi.update(selectedVideo.id, formData);
        showToast('Video berhasil diperbarui!');
      } else {
        await videoApi.create(formData);
        showToast('Video baru berhasil ditambahkan!');
      }
      setIsModalOpen(false);
      fetchVideos();
    } catch (error: any) {
      alert(error.message || 'Gagal menyimpan video');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.video) return;
    try {
      await videoApi.delete(deleteModal.video.id);
      showToast('Video berhasil dihapus!');
      setDeleteModal({ isOpen: false, video: null });
      fetchVideos();
    } catch (error: any) {
      alert(error.message || 'Gagal menghapus video');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-[#012D1D] px-4 py-3 text-sm font-semibold text-white shadow-xl animate-in slide-in-from-bottom duration-300">
          <CheckCircle2 size={18} className="text-[#80E478]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Poppins'] text-gray-900 tracking-tight">
            Kelola Video Bank Sampah
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tambah dan kelola video Bank Sampah yang terhubung ke YouTube, Instagram, dan TikTok.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchVideos()}
            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
            title="Segarkan Data"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 rounded-xl bg-[#012D1D] hover:bg-[#0B4A31] text-white px-5 py-2.5 font-bold text-sm shadow-md shadow-[#012D1D]/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={18} />
            <span>Tambah Video</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block font-['Poppins']">
            Total Video
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#012D1D] mt-1 font-['Poppins']">
            {stats.all}
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block">Semua platform sosmed</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold text-red-500 uppercase tracking-wider block font-['Poppins']">
            YouTube
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 font-['Poppins']">
            {stats.youtube}
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block">Video dokumenter & edukasi</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold text-pink-600 uppercase tracking-wider block font-['Poppins']">
            Instagram
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 font-['Poppins']">
            {stats.instagram}
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block">Reels & dokumentasi warga</span>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold text-gray-900 uppercase tracking-wider block font-['Poppins']">
            TikTok
          </span>
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1 font-['Poppins']">
            {stats.tiktok}
          </p>
          <span className="text-[11px] text-gray-400 mt-1 block">Video singkat & tips pilah</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        {/* Platform Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            onClick={() => setPlatformFilter('ALL')}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              platformFilter === 'ALL'
                ? 'bg-[#012D1D] text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Semua ({stats.all})
          </button>
          <button
            onClick={() => setPlatformFilter('YouTube')}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              platformFilter === 'YouTube'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            YouTube ({stats.youtube})
          </button>
          <button
            onClick={() => setPlatformFilter('Instagram')}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              platformFilter === 'Instagram'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Instagram ({stats.instagram})
          </button>
          <button
            onClick={() => setPlatformFilter('TikTok')}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
              platformFilter === 'TikTok'
                ? 'bg-black text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            TikTok ({stats.tiktok})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul atau topik..."
            className="w-full rounded-full border border-gray-200 bg-gray-50 pl-9 pr-4 py-2 text-xs sm:text-sm focus:border-[#3B9734] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B9734]/20 transition-all"
          />
        </div>
      </div>

      {/* Video Table */}
      <VideoTable
        videos={filteredVideos}
        isLoading={isLoading}
        onEdit={handleOpenEditModal}
        onDelete={(video) => setDeleteModal({ isOpen: true, video })}
        onAddNew={handleOpenAddModal}
      />

      {/* Add / Edit Video Modal */}
      <VideoModal
        isOpen={isModalOpen}
        item={selectedVideo}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitModal}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        title="Hapus Video Bank Sampah?"
        itemName={deleteModal.video?.title || ''}
        confirmText="Hapus Video"
        description={`Apakah Anda yakin ingin menghapus video "${deleteModal.video?.title}"? Video ini tidak akan lagi tampil di halaman Bank Sampah.`}
        onClose={() => setDeleteModal({ isOpen: false, video: null })}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

