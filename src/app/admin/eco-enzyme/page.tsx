'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Edit2, 
  Trash2, 
  QrCode, 
  Calendar,
  X,
  Droplet,
  RotateCcw,
  Film,
  Play,
  RefreshCw,
  Video
} from 'lucide-react';
import { EcoEnzymeBatch, EcoEnzymeVideoItem, EcoEnzymeVideoPlatform } from '@/types';
import { ecoEnzymeApi } from '@/lib/api/eco-enzyme';
import { ecoEnzymeVideoApi, getEcoEnzymeVideoThumbnailUrl } from '@/lib/api/eco-enzyme-video';
import { 
  getDaysRemaining, 
  getFermentationProgress, 
  getDayPassed, 
  parseOrganicWasteTypes 
} from '@/lib/eco-enzyme';
import { EcoEnzymeModal } from '@/components/admin/EcoEnzymeModal';
import { EcoEnzymeHarvestModal } from '@/components/admin/EcoEnzymeHarvestModal';
import { EcoEnzymeQrModal } from '@/components/admin/EcoEnzymeQrModal';
import { EcoEnzymeVideoModal } from '@/components/admin/EcoEnzymeVideoModal';
import { EcoEnzymeVideoTable } from '@/components/admin/EcoEnzymeVideoTable';
import { DeleteModal } from '@/components/admin/DeleteModal';
import { toast } from 'sonner';

// Format satuan agar mudah dibaca manusia (misal 150 gr, 3 L, 1 kg)
function formatWeight(kgValue: number | string | undefined | null): string {
  const num = Number(kgValue) || 0;
  if (num === 0) return '0 gr';
  if (num < 1) {
    return `${Math.round(num * 1000)} gr`;
  }
  return `${num % 1 === 0 ? num : num.toFixed(2)} kg`;
}

export default function AdminEcoEnzymePage() {
  const [activeTab, setActiveTab] = useState<'BATCHES' | 'VIDEOS'>('BATCHES');

  // ════════════════ STATE GALON FERMENTASI ════════════════
  const [batches, setBatches] = useState<EcoEnzymeBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<EcoEnzymeBatch | null>(null);

  const [isHarvestModalOpen, setIsHarvestModalOpen] = useState(false);
  const [activeHarvestBatch, setActiveHarvestBatch] = useState<EcoEnzymeBatch | null>(null);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [activeQrBatch, setActiveQrBatch] = useState<EcoEnzymeBatch | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({ isOpen: false, id: '', name: '' });

  // ════════════════ STATE VIDEO EDUKASI ════════════════
  const [videos, setVideos] = useState<EcoEnzymeVideoItem[]>([]);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoSearchTerm, setVideoSearchTerm] = useState('');
  const [videoPlatformFilter, setVideoPlatformFilter] = useState<'ALL' | EcoEnzymeVideoPlatform>('ALL');

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<EcoEnzymeVideoItem | null>(null);

  const [previewVideo, setPreviewVideo] = useState<EcoEnzymeVideoItem | null>(null);

  const [videoDeleteModal, setVideoDeleteModal] = useState<{
    isOpen: boolean;
    video: EcoEnzymeVideoItem | null;
  }>({
    isOpen: false,
    video: null,
  });

  // ════════════════ LOAD DATA ════════════════
  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await ecoEnzymeApi.getAll({ includeArchived: true });
      setBatches(data);
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat data Eco Enzyme');
    } finally {
      setIsLoading(false);
    }
  };

  const loadVideos = async () => {
    setIsVideoLoading(true);
    try {
      const data = await ecoEnzymeVideoApi.getAll({ limit: 100 });
      setVideos(data);
    } catch (err: any) {
      console.error('Failed to load eco enzyme videos:', err);
      toast.error(err.message || 'Gagal memuat video edukasi Eco Enzyme');
    } finally {
      setIsVideoLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadVideos();
  }, []);

  // Filter pencarian & status galon
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.containerName.toLowerCase().includes(q) ||
        b.batchCode.toLowerCase().includes(q) ||
        (b.publicCode && b.publicCode.toLowerCase().includes(q)) ||
        (b.organicWasteTypes && b.organicWasteTypes.toLowerCase().includes(q));

      if (!matchSearch) return false;

      const isArchived = Boolean(b.archivedAt || b.status === 'ARCHIVED');

      if (statusFilter === 'ARCHIVED') return isArchived;
      if (isArchived) return false;

      if (statusFilter === 'ALL') return true;
      const currentStatus = b.displayStatus || b.status;
      return currentStatus === statusFilter;
    });
  }, [batches, searchTerm, statusFilter]);

  // Filter video edukasi
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      const matchPlatform = videoPlatformFilter === 'ALL' || v.platform === videoPlatformFilter;
      const q = videoSearchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        v.title.toLowerCase().includes(q) ||
        (v.description && v.description.toLowerCase().includes(q)) ||
        (v.category && v.category.toLowerCase().includes(q));
      return matchPlatform && matchSearch;
    });
  }, [videos, videoPlatformFilter, videoSearchTerm]);

  // Statistik video edukasi
  const videoStats = useMemo(() => {
    return {
      all: videos.length,
      local: videos.filter((v) => v.platform === 'Local').length,
      youtube: videos.filter((v) => v.platform === 'YouTube').length,
      tiktok: videos.filter((v) => v.platform === 'TikTok').length,
      instagram: videos.filter((v) => v.platform === 'Instagram').length,
    };
  }, [videos]);

  // ════════════════ HANDLER GALON FERMENTASI ════════════════
  const handleCreateOrUpdateBatch = async (data: any) => {
    try {
      if (editingBatch) {
        await ecoEnzymeApi.update(editingBatch.id, data);
        toast.success('Data galon berhasil diperbarui');
      } else {
        const newBatch = await ecoEnzymeApi.create(data);
        toast.success('Galon berhasil didaftarkan!', {
          description: `Kode: ${newBatch.batchCode || newBatch.publicCode}`,
        });
        setActiveQrBatch(newBatch);
        setIsQrModalOpen(true);
      }
      setIsBatchModalOpen(false);
      setEditingBatch(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan data galon');
    }
  };

  const handleHarvestSubmit = async (data: any) => {
    if (!activeHarvestBatch) return;
    try {
      await ecoEnzymeApi.harvest(activeHarvestBatch.id, data);
      setIsHarvestModalOpen(false);
      setActiveHarvestBatch(null);
      toast.success('Panen berhasil dicatat!');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mencatat panen');
    }
  };

  const confirmArchive = async () => {
    try {
      await ecoEnzymeApi.archive(deleteModal.id);
      toast.success('Galon berhasil diarsipkan');
      setDeleteModal({ isOpen: false, id: '', name: '' });
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengarsipkan galon');
    }
  };

  const handleRestore = async (batch: EcoEnzymeBatch) => {
    try {
      await ecoEnzymeApi.restore(batch.id);
      toast.success(`Galon ${batch.containerName} berhasil dipulihkan`);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memulihkan galon');
    }
  };

  // ════════════════ HANDLER VIDEO EDUKASI ════════════════
  const handleOpenAddVideo = () => {
    setSelectedVideo(null);
    setIsVideoModalOpen(true);
  };

  const handleOpenEditVideo = (video: EcoEnzymeVideoItem) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  };

  const handleSubmitVideo = async (formData: FormData) => {
    try {
      if (selectedVideo) {
        await ecoEnzymeVideoApi.update(selectedVideo.id, formData);
        toast.success('Video edukasi Eco Enzyme berhasil diperbarui!');
      } else {
        await ecoEnzymeVideoApi.create(formData);
        toast.success('Video edukasi Eco Enzyme baru berhasil ditambahkan!');
      }
      setIsVideoModalOpen(false);
      loadVideos();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan video edukasi');
    }
  };

  const handleDeleteVideoConfirm = async () => {
    if (!videoDeleteModal.video) return;
    try {
      await ecoEnzymeVideoApi.delete(videoDeleteModal.video.id);
      toast.success('Video edukasi Eco Enzyme berhasil dihapus!');
      setVideoDeleteModal({ isOpen: false, video: null });
      loadVideos();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus video edukasi');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* ════════════════ TAB SWITCHER ════════════════ */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('BATCHES')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'BATCHES'
              ? 'bg-[#012D1D] text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Droplet className="w-4 h-4 text-[#80E478]" />
          <span>Galon Fermentasi</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === 'BATCHES' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
          }`}>
            {batches.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('VIDEOS')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            activeTab === 'VIDEOS'
              ? 'bg-[#012D1D] text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Film className="w-4 h-4 text-[#FC9634]" />
          <span>Kelola Video Edukasi</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === 'VIDEOS' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
          }`}>
            {videos.length}
          </span>
        </button>
      </div>

      {/* ════════════════ TAB 1: GALON FERMENTASI ════════════════ */}
      {activeTab === 'BATCHES' && (
        <div className="flex flex-col gap-6">
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                Manajemen Eco Enzyme
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                Kelola isi fermentasi galon dan cetak barcode QR untuk setiap wadah.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingBatch(null);
                setIsBatchModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#012D1D] hover:bg-[#0B4A31] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-all active:scale-95 self-start sm:self-center"
              type="button"
            >
              <Plus className="w-4 h-4 text-[#FC9634]" />
              <span>Input Galon Baru</span>
            </button>
          </header>

          {/* Search & Filter Bar */}
          <div className="rounded-2xl border border-stone-200 bg-white p-2.5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama galon, kode, atau buah..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#FAFBF9] border border-stone-200 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#012D1D] focus:bg-white"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    type="button"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="w-full sm:w-[180px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-10 appearance-none bg-[#FAFBF9] border border-stone-200 rounded-xl px-3.5 text-xs font-semibold text-stone-700 focus:outline-none focus:border-[#012D1D] cursor-pointer"
                >
                  <option value="ALL">Semua Galon</option>
                  <option value="FERMENTING">Sedang Fermentasi</option>
                  <option value="READY_TO_HARVEST">Siap Panen</option>
                  <option value="HARVESTED">Sudah Dipanen</option>
                  <option value="ARCHIVED">Arsip Galon</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Galon */}
          <div className="rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <h2 className="text-sm font-bold text-stone-900">
                Daftar Galon Fermentasi
              </h2>
              <span className="text-xs text-stone-400 font-medium">
                {filteredBatches.length} total galon
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredBatches.length === 0 ? (
              <div className="text-center py-16 text-stone-500">
                <p className="text-xs font-semibold text-stone-700">Tidak ada galon yang ditemukan.</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  {searchTerm ? 'Coba ubah kata kunci pencarian.' : 'Silakan klik "Input Galon Baru" untuk mencatat galon.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAFBF9] text-stone-500 font-semibold border-b border-stone-100">
                    <tr>
                      <th className="py-3 px-6">Wadah &amp; Kode</th>
                      <th className="py-3 px-4">Bahan (1:3:10)</th>
                      <th className="py-3 px-4">Linimasa</th>
                      <th className="py-3 px-4">Status &amp; Progres</th>
                      <th className="py-3 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredBatches.map((batch) => {
                      const displayStatus = batch.displayStatus || batch.status;
                      const dayPassed = batch.dayPassed || getDayPassed(batch.startDate);
                      const progress = batch.progressPercent ?? getFermentationProgress(batch.startDate, batch.harvestEstimate);
                      const daysLeft = getDaysRemaining(batch.harvestEstimate);
                      const isArchived = Boolean(batch.archivedAt || batch.status === 'ARCHIVED');
                      const isHarvested = batch.status === 'HARVESTED';
                      const isReady = displayStatus === 'READY_TO_HARVEST' || progress >= 100;
                      const fruits = parseOrganicWasteTypes(batch.organicWasteTypes);

                      return (
                        <tr key={batch.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-4 px-6 align-middle">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black bg-[#012D1D] text-white px-2 py-0.5 rounded-md">
                                {batch.batchCode || 'GL-01'}
                              </span>
                              <span className="font-bold text-stone-900 text-sm">
                                {batch.containerName}
                              </span>
                            </div>
                            {batch.organicWasteTypes && (
                              <p className="text-[11px] text-stone-500 mt-1 max-w-[240px] truncate" title={batch.organicWasteTypes}>
                                BO: {fruits.join(', ')}
                              </p>
                            )}
                          </td>

                          <td className="py-4 px-4 align-middle whitespace-nowrap text-stone-700">
                            <div className="space-y-0.5 text-[11px]">
                              <div>Air: <strong>{Number(batch.waterLiter)} L</strong></div>
                              <div>Pemanis: <strong className="text-amber-800">{formatWeight(batch.molassesKg)}</strong></div>
                              <div>BO: <strong className="text-emerald-800">{formatWeight(batch.organicWasteKg)}</strong></div>
                            </div>
                          </td>

                          <td className="py-4 px-4 align-middle whitespace-nowrap text-stone-700">
                            <div className="space-y-0.5 text-[11px]">
                              <div>Tanggal Buat: <strong>{new Date(batch.startDate).toLocaleDateString('id-ID')}</strong></div>
                              <div className="text-emerald-900 font-semibold">
                                Tanggal Panen: <strong>{new Date(batch.harvestEstimate).toLocaleDateString('id-ID')}</strong>
                              </div>
                              <div className="text-[10px] text-stone-400">Hari ke-{dayPassed} dari 90</div>
                            </div>
                          </td>

                          <td className="py-4 px-4 align-middle min-w-[140px]">
                            {isArchived ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                                Diarsipkan
                              </span>
                            ) : isHarvested ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                                <CheckCircle2 className="w-3 h-3" /> Dipanen
                              </span>
                            ) : isReady ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
                                  <Sparkles className="w-3 h-3 text-emerald-600" /> Siap Panen
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-bold text-stone-600">
                                  <span>{progress}%</span>
                                  <span>{daysLeft} hari lagi</span>
                                </div>
                                <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-[#FC9634] h-full rounded-full"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </td>

                          <td className="py-4 px-6 align-middle text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveQrBatch(batch);
                                  setIsQrModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-xs transition-colors"
                                title="Cetak atau unduh label barcode galon"
                              >
                                <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Label QR</span>
                              </button>

                              {!isArchived && !isHarvested && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveHarvestBatch(batch);
                                    setIsHarvestModalOpen(true);
                                  }}
                                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                                    isReady
                                      ? 'bg-[#012D1D] hover:bg-[#0B4A31] text-white shadow-2xs'
                                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                                  }`}
                                  title="Catat hasil panen"
                                >
                                  Panen
                                </button>
                              )}

                              {!isArchived && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingBatch(batch);
                                    setIsBatchModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                                  title="Edit data"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {isArchived ? (
                                <button
                                  type="button"
                                  onClick={() => handleRestore(batch)}
                                  className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                                  title="Pulihkan dari arsip"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteModal({
                                      isOpen: true,
                                      id: batch.id,
                                      name: `${batch.containerName} (${batch.batchCode || batch.publicCode})`,
                                    });
                                  }}
                                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title="Arsipkan galon"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ TAB 2: VIDEO EDUKASI ECO ENZYME ════════════════ */}
      {activeTab === 'VIDEOS' && (
        <div className="flex flex-col gap-6">
          {/* Header Video */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                Kelola Video Edukasi Eco Enzyme
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                Kelola video panduan manfaat dan cara pembuatan Eco Enzyme yang tampil pada halaman publik.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadVideos()}
                className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors shadow-xs"
                title="Segarkan Data"
                type="button"
              >
                <RefreshCw className={`w-4 h-4 ${isVideoLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handleOpenAddVideo}
                className="inline-flex items-center gap-2 rounded-xl bg-[#012D1D] hover:bg-[#0B4A31] text-white px-5 py-2.5 font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95"
                type="button"
              >
                <Plus className="w-4 h-4 text-[#FC9634]" />
                <span>Tambah Video Edukasi</span>
              </button>
            </div>
          </header>

          {/* Statistik Kartu Video */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
              <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Total Video</span>
              <span className="text-2xl font-black text-stone-900 mt-1 block">{videoStats.all}</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">MP4 Lokal</span>
              <span className="text-2xl font-black text-emerald-800 mt-1 block">{videoStats.local}</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
              <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider block">YouTube</span>
              <span className="text-2xl font-black text-red-700 mt-1 block">{videoStats.youtube}</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
              <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">TikTok / IG</span>
              <span className="text-2xl font-black text-stone-800 mt-1 block">{videoStats.tiktok + videoStats.instagram}</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="rounded-2xl border border-stone-200 bg-white p-3 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari video edukasi berdasarkan judul, topik, atau deskripsi..."
                  value={videoSearchTerm}
                  onChange={(e) => setVideoSearchTerm(e.target.value)}
                  className="w-full bg-[#FAFBF9] border border-stone-200 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#012D1D] focus:bg-white"
                />
                {videoSearchTerm && (
                  <button
                    onClick={() => setVideoSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    type="button"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Platform Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'ALL', label: 'Semua Platform' },
                { id: 'Local', label: 'Video MP4 Lokal' },
                { id: 'YouTube', label: 'YouTube' },
                { id: 'TikTok', label: 'TikTok' },
                { id: 'Instagram', label: 'Instagram' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setVideoPlatformFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                    videoPlatformFilter === tab.id
                      ? 'bg-[#012D1D] text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table Video Edukasi Eco Enzyme */}
          <EcoEnzymeVideoTable
            videos={filteredVideos}
            isLoading={isVideoLoading}
            onAddNew={handleOpenAddVideo}
            onEdit={handleOpenEditVideo}
            onPreview={(video) => setPreviewVideo(video)}
            onDelete={(video) =>
              setVideoDeleteModal({
                isOpen: true,
                video,
              })
            }
          />
        </div>
      )}

      {/* ════════════════ MODALS ════════════════ */}
      {/* 1. Modal Input / Edit Galon */}
      <EcoEnzymeModal
        isOpen={isBatchModalOpen}
        onClose={() => {
          setIsBatchModalOpen(false);
          setEditingBatch(null);
        }}
        onSubmit={handleCreateOrUpdateBatch}
        initialData={editingBatch}
      />

      {/* 2. Modal Barcode & QR Code Label */}
      <EcoEnzymeQrModal
        isOpen={isQrModalOpen}
        onClose={() => {
          setIsQrModalOpen(false);
          setActiveQrBatch(null);
        }}
        batch={activeQrBatch}
        onQrPrinted={loadData}
      />

      {/* 3. Modal Panen */}
      <EcoEnzymeHarvestModal
        isOpen={isHarvestModalOpen}
        onClose={() => {
          setIsHarvestModalOpen(false);
          setActiveHarvestBatch(null);
        }}
        onSubmit={handleHarvestSubmit}
        batch={activeHarvestBatch}
      />

      {/* 4. Modal Konfirmasi Arsip Galon */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: '', name: '' })}
        onConfirm={confirmArchive}
        title="Arsipkan Galon Eco Enzyme"
        itemName={deleteModal.name}
        confirmText="Arsipkan Galon"
        description="Galon ini akan dipindahkan ke arsip. QR Code pada fisik galon tetap dapat dipindai oleh warga."
      />

      {/* 5. Modal Tambah / Edit Video Edukasi */}
      <EcoEnzymeVideoModal
        isOpen={isVideoModalOpen}
        onClose={() => {
          setIsVideoModalOpen(false);
          setSelectedVideo(null);
        }}
        onSubmit={handleSubmitVideo}
        item={selectedVideo}
      />

      {/* 6. Modal Konfirmasi Hapus Video Edukasi */}
      <DeleteModal
        isOpen={videoDeleteModal.isOpen}
        onClose={() => setVideoDeleteModal({ isOpen: false, video: null })}
        onConfirm={handleDeleteVideoConfirm}
        title="Hapus Video Edukasi Eco Enzyme"
        itemName={videoDeleteModal.video?.title || ''}
        confirmText="Hapus Video"
        description="Video edukasi ini akan dihapus permanen dari daftar dan tidak akan tampil lagi di halaman Eco Enzyme."
      />

      {/* 7. Modal Preview Video Player */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-stone-900 rounded-3xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-stone-700 relative text-white space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#FC9634] block">
                  {previewVideo.category || 'Video Edukasi'}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {previewVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-[9/13] max-h-[70vh] w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              {previewVideo.videoUrl.startsWith('http://') || previewVideo.videoUrl.startsWith('https://') ? (
                previewVideo.videoUrl.includes('youtube.com') || previewVideo.videoUrl.includes('youtu.be') ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${
                      previewVideo.videoUrl.match(/(?:youtu\.be\/|watch\?v=)([^"&?\/\s]{11})/)?.[1] || ''
                    }?autoplay=1`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                    src={previewVideo.videoUrl}
                  />
                )
              ) : (
                <video
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                  src={previewVideo.videoUrl}
                >
                  Browser tidak mendukung video HTML5.
                </video>
              )}
            </div>

            {previewVideo.description && (
              <p className="text-xs text-stone-300 leading-relaxed pt-1">
                {previewVideo.description}
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
