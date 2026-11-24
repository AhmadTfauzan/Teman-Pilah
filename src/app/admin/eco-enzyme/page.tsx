'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  QrCode,
  ClipboardList,
  X,
  Droplet,
  RotateCcw,
  Film,
  RefreshCw,
  ExternalLink,
  ChevronDown,
} from 'lucide-react';
import {
  EcoEnzymeBatch,
  EcoEnzymeVideoItem,
  EcoEnzymeVideoPlatform,
  EnzymeType,
} from '@/types';
import { ecoEnzymeApi } from '@/lib/api/eco-enzyme';
import { ecoEnzymeVideoApi, getEcoEnzymeVideoThumbnailUrl } from '@/lib/api/eco-enzyme-video';
import {
  getDaysRemaining,
  getFermentationProgress,
  getDayPassed,
  getEnzymeTypeMeta,
  getSweetenerMeta,
  normalizeEnzymeType,
  parseOrganicWasteTypes,
} from '@/lib/eco-enzyme';
import { EcoEnzymeModal, EcoEnzymeModalSubmitData } from '@/components/admin/EcoEnzymeModal';
import {
  EcoEnzymeHarvestModal,
  EcoEnzymeHarvestSubmitData,
} from '@/components/admin/EcoEnzymeHarvestModal';
import { EcoEnzymeLogModal } from '@/components/admin/EcoEnzymeLogModal';
import { EcoEnzymeQrModal } from '@/components/admin/EcoEnzymeQrModal';
import { EcoEnzymeVideoModal } from '@/components/admin/EcoEnzymeVideoModal';
import { EcoEnzymeVideoTable } from '@/components/admin/EcoEnzymeVideoTable';
import { DeleteModal } from '@/components/admin/DeleteModal';
import { toast } from 'sonner';

function extractYouTubeVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i
  );
  return match ? match[1] : null;
}

function isDirectVideoSource(video: EcoEnzymeVideoItem): boolean {
  const url = video.videoUrl.trim();
  const lower = url.toLowerCase();
  if (video.platform === 'Local') return true;
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  return /\.(mp4|webm|ogg|mov)(?:[?#].*)?$/.test(lower);
}

function getSafeExternalUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

const VIDEO_PLATFORM_TABS: { id: 'ALL' | EcoEnzymeVideoPlatform; label: string }[] = [
  { id: 'ALL', label: 'Semua Platform' },
  { id: 'Local', label: 'Video MP4 Lokal' },
  { id: 'YouTube', label: 'YouTube' },
  { id: 'TikTok', label: 'TikTok' },
  { id: 'Instagram', label: 'Instagram' },
];

// Format satuan agar mudah dibaca manusia (misal 150 gr, 3 L, 1 kg)
function formatWeight(kgValue: number | string | undefined | null): string {
  const num = Number(kgValue) || 0;
  if (num === 0) return '0 gr';
  if (num < 1) {
    return `${Math.round(num * 1000)} gr`;
  }
  return `${num % 1 === 0 ? num : num.toFixed(2)} kg`;
}

function getBatchDisplayState(batch: EcoEnzymeBatch) {
  const displayStatus = batch.displayStatus || batch.status;
  const dayPassed = batch.dayPassed || getDayPassed(batch.startDate);
  const progress =
    batch.progressPercent ??
    getFermentationProgress(batch.startDate, batch.harvestEstimate);
  const daysLeft = getDaysRemaining(batch.harvestEstimate);
  const isArchived = Boolean(batch.archivedAt || batch.status === 'ARCHIVED');
  const isHarvested = batch.status === 'HARVESTED';
  const isFailed = batch.status === 'FAILED' || displayStatus === 'FAILED';
  const isReady =
    !isFailed &&
    !isHarvested &&
    !isArchived &&
    (displayStatus === 'READY_TO_HARVEST' || progress >= 100);

  return {
    displayStatus,
    dayPassed,
    progress,
    daysLeft,
    isArchived,
    isHarvested,
    isFailed,
    isReady,
  };
}

export default function AdminEcoEnzymePage() {
  const [activeTab, setActiveTab] = useState<'BATCHES' | 'VIDEOS'>('BATCHES');

  // ════════════════ STATE GALON FERMENTASI ════════════════
  const [batches, setBatches] = useState<EcoEnzymeBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [enzymeTypeFilter, setEnzymeTypeFilter] = useState<'ALL' | EnzymeType>('ALL');

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<EcoEnzymeBatch | null>(null);

  const [isHarvestModalOpen, setIsHarvestModalOpen] = useState(false);
  const [activeHarvestBatch, setActiveHarvestBatch] = useState<EcoEnzymeBatch | null>(null);

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [activeLogBatch, setActiveLogBatch] = useState<EcoEnzymeBatch | null>(null);

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [activeQrBatch, setActiveQrBatch] = useState<EcoEnzymeBatch | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({ isOpen: false, id: '', name: '' });
  const [isArchivingBatch, setIsArchivingBatch] = useState(false);

  const [permanentDeleteModal, setPermanentDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({ isOpen: false, id: '', name: '' });
  const [isDeletingPermanently, setIsDeletingPermanently] = useState(false);

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
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);

  // ════════════════ LOAD DATA ════════════════
  const loadData = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const data = await ecoEnzymeApi.getAll({ includeArchived: true });
      setBatches(data);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat data Eco Enzyme');
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  const loadVideos = async (silent = false) => {
    if (!silent) {
      setIsVideoLoading(true);
    }
    try {
      const data = await ecoEnzymeVideoApi.getAll({ limit: 100 });
      setVideos(data);
    } catch (err: unknown) {
      console.error('Failed to load eco enzyme videos:', err);
      toast.error(err instanceof Error ? err.message : 'Gagal memuat video edukasi Eco Enzyme');
    } finally {
      if (!silent) {
        setIsVideoLoading(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await ecoEnzymeApi.getAll({ includeArchived: true });
        if (!cancelled) {
          setBatches(data);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : 'Gagal memuat data Eco Enzyme');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    (async () => {
      try {
        const data = await ecoEnzymeVideoApi.getAll({ limit: 100 });
        if (!cancelled) {
          setVideos(data);
        }
      } catch (err: unknown) {
        console.error('Failed to load eco enzyme videos:', err);
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : 'Gagal memuat video edukasi Eco Enzyme');
        }
      } finally {
        if (!cancelled) {
          setIsVideoLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Filter pencarian, jenis enzim & status galon
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

      if (enzymeTypeFilter !== 'ALL' && normalizeEnzymeType(b.enzymeType) !== enzymeTypeFilter) {
        return false;
      }

      const isArchived = Boolean(b.archivedAt || b.status === 'ARCHIVED');

      if (statusFilter === 'ARCHIVED') return isArchived;
      if (isArchived) return false;

      if (statusFilter === 'ALL') return true;
      const currentStatus = b.displayStatus || b.status;
      return currentStatus === statusFilter;
    });
  }, [batches, searchTerm, statusFilter, enzymeTypeFilter]);

  const hasActiveBatchFilter = Boolean(
    searchTerm.trim() || statusFilter !== 'ALL' || enzymeTypeFilter !== 'ALL'
  );

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
  const handleCreateOrUpdateBatch = async (data: EcoEnzymeModalSubmitData) => {
    try {
      if (editingBatch) {
        await ecoEnzymeApi.update(editingBatch.id, data);
        toast.success('Data galon berhasil diperbarui');
      } else {
        const newBatch = await ecoEnzymeApi.create(data);
        toast.success(
          newBatch.reusedQr
            ? 'Galon berhasil didaftarkan (memakai QR permanen yang sudah ada)'
            : 'Galon berhasil didaftarkan!',
          {
            description: `Kode: ${newBatch.batchCode || newBatch.publicCode}`,
          }
        );
        setActiveQrBatch(newBatch);
        setIsQrModalOpen(true);
      }
      setIsBatchModalOpen(false);
      setEditingBatch(null);
      await loadData(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan data galon');
      throw err;
    }
  };

  const handleHarvestSubmit = async (data: EcoEnzymeHarvestSubmitData) => {
    if (!activeHarvestBatch) return;
    try {
      await ecoEnzymeApi.harvest(activeHarvestBatch.id, data);
      setIsHarvestModalOpen(false);
      setActiveHarvestBatch(null);
      toast.success('Panen berhasil dicatat!');
      await loadData(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mencatat panen');
      throw err;
    }
  };

  const confirmArchive = async () => {
    if (!deleteModal.id || isArchivingBatch) return;
    const targetId = deleteModal.id;
    setIsArchivingBatch(true);
    try {
      await ecoEnzymeApi.archive(targetId);
      toast.success('Galon berhasil diarsipkan');
      setDeleteModal({ isOpen: false, id: '', name: '' });
      await loadData(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengarsipkan galon');
    } finally {
      setIsArchivingBatch(false);
    }
  };

  const confirmPermanentDelete = async () => {
    if (!permanentDeleteModal.id || isDeletingPermanently) return;
    const targetId = permanentDeleteModal.id;
    setIsDeletingPermanently(true);
    try {
      await ecoEnzymeApi.delete(targetId);
      toast.success('Galon berhasil dihapus permanen');
      setPermanentDeleteModal({ isOpen: false, id: '', name: '' });
      await loadData(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus galon secara permanen');
    } finally {
      setIsDeletingPermanently(false);
    }
  };

  const handleRestore = async (batch: EcoEnzymeBatch) => {
    try {
      await ecoEnzymeApi.restore(batch.id);
      toast.success(`Galon ${batch.containerName} berhasil dipulihkan`);
      await loadData(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memulihkan galon');
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
      setSelectedVideo(null);
      await loadVideos(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan video edukasi');
      throw err;
    }
  };

  const handleDeleteVideoConfirm = async () => {
    if (!videoDeleteModal.video || isDeletingVideo) return;
    const targetId = videoDeleteModal.video.id;
    setIsDeletingVideo(true);
    try {
      await ecoEnzymeVideoApi.delete(targetId);
      toast.success('Video edukasi Eco Enzyme berhasil dihapus!');
      setVideoDeleteModal({ isOpen: false, video: null });
      await loadVideos(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus video edukasi');
    } finally {
      setIsDeletingVideo(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      
      {/* ════════════════ TAB SWITCHER ════════════════ */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2.5 sm:pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('BATCHES')}
          className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'BATCHES'
              ? 'bg-[#012D1D] text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Droplet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#80E478]" />
          <span>Galon Fermentasi</span>
          <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === 'BATCHES' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
          }`}>
            {batches.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('VIDEOS')}
          className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
            activeTab === 'VIDEOS'
              ? 'bg-[#012D1D] text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
          }`}
        >
          <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#FC9634]" />
          <span>Video Edukasi</span>
          <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === 'VIDEOS' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
          }`}>
            {videos.length}
          </span>
        </button>
      </div>

      {/* ════════════════ TAB 1: GALON FERMENTASI ════════════════ */}
      {activeTab === 'BATCHES' && (
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-black text-stone-900 tracking-tight">
                Manajemen Eco Enzyme
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5 sm:mt-1">
                Kelola isi fermentasi galon dan cetak barcode QR untuk setiap wadah.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingBatch(null);
                setIsBatchModalOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#012D1D] hover:bg-[#0B4A31] px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-all active:scale-95 self-start sm:self-center"
              type="button"
            >
              <Plus className="w-4 h-4 text-[#FC9634]" />
              <span>Input Galon Baru</span>
            </button>
          </header>

          {/* Search & Filter Bar */}
          <div className="rounded-xl sm:rounded-2xl border border-stone-200 bg-white p-2 sm:p-2.5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2.5">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama galon, kode, atau buah..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#FAFBF9] border border-stone-200 rounded-xl pl-9 sm:pl-10 pr-9 py-1.5 sm:py-2 text-xs sm:text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#012D1D] focus:bg-white"
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

              <div className="relative w-full sm:w-[170px]">
                <select
                  value={enzymeTypeFilter}
                  onChange={(e) => setEnzymeTypeFilter(e.target.value as 'ALL' | EnzymeType)}
                  aria-label="Filter jenis enzim"
                  className="w-full h-9 sm:h-10 appearance-none bg-[#FAFBF9] border border-stone-200 rounded-xl pl-3 sm:pl-3.5 pr-9 text-xs font-semibold text-stone-700 focus:outline-none focus:border-[#012D1D] cursor-pointer"
                >
                  <option value="ALL">Semua Jenis</option>
                  <option value="ECO_ENZYME">Eco Enzyme</option>
                  <option value="CLASSIC_ENZYME">Classic Enzyme</option>
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none w-4 h-4 text-stone-500 absolute right-3 top-1/2 -translate-y-1/2"
                />
              </div>

              <div className="relative w-full sm:w-[185px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter status galon"
                  className="w-full h-9 sm:h-10 appearance-none bg-[#FAFBF9] border border-stone-200 rounded-xl pl-3 sm:pl-3.5 pr-9 text-xs font-semibold text-stone-700 focus:outline-none focus:border-[#012D1D] cursor-pointer"
                >
                  <option value="ALL">Semua Galon</option>
                  <option value="FERMENTING">Sedang Fermentasi</option>
                  <option value="READY_TO_HARVEST">Siap Panen</option>
                  <option value="HARVESTED">Sudah Dipanen</option>
                  <option value="FAILED">Gagal Fermentasi</option>
                  <option value="ARCHIVED">Arsip Galon</option>
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none w-4 h-4 text-stone-500 absolute right-3 top-1/2 -translate-y-1/2"
                />
              </div>
            </div>
          </div>

          {/* Table Galon */}
          <div className="rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-4 border-b border-stone-100">
              <h2 className="text-xs sm:text-sm font-bold text-stone-900">
                Daftar Galon Fermentasi
              </h2>
              <span className="text-[11px] sm:text-xs text-stone-400 font-medium">
                {filteredBatches.length} total galon
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16 sm:py-20">
                <div className="w-8 h-8 border-3 border-emerald-800 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredBatches.length === 0 ? (
              <div className="text-center py-12 sm:py-16 px-4 text-stone-500">
                <p className="text-xs font-semibold text-stone-700">Tidak ada galon yang ditemukan.</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  {hasActiveBatchFilter
                    ? 'Coba ubah kata kunci pencarian atau reset filter jenis & status galon.'
                    : 'Silakan klik "Input Galon Baru" untuk mencatat galon.'}
                </p>
                {hasActiveBatchFilter && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('ALL');
                      setEnzymeTypeFilter('ALL');
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 px-3 py-1.5 text-[11px] font-bold text-stone-700 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile 2-Column Card Grid */}
                <div className="grid grid-cols-2 gap-2.5 p-3 md:hidden">
                  {filteredBatches.map((batch) => {
                    const {
                      dayPassed,
                      progress,
                      daysLeft,
                      isArchived,
                      isHarvested,
                      isFailed,
                      isReady,
                    } = getBatchDisplayState(batch);
                    const enzymeType = normalizeEnzymeType(batch.enzymeType);
                    const enzymeMeta = getEnzymeTypeMeta(enzymeType);
                    const sweetenerMeta = getSweetenerMeta(batch.sweetenerType, enzymeType);
                    const isClassic = enzymeType === 'CLASSIC_ENZYME';

                    return (
                      <div
                        key={batch.id}
                        className="flex flex-col justify-between rounded-xl border border-stone-200 bg-[#FAFBF9] p-2.5 gap-2"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className="font-mono text-[10px] font-black bg-[#012D1D] text-white px-1.5 py-0.5 rounded">
                              {batch.batchCode || 'GL-01'}
                            </span>
                            {isArchived ? (
                              <span className="text-[9px] font-semibold text-stone-500 bg-stone-200/70 px-1.5 py-0.5 rounded">
                                Arsip
                              </span>
                            ) : isHarvested ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-200">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Dipanen
                              </span>
                            ) : isFailed ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-200">
                                <AlertCircle className="w-2.5 h-2.5" /> Gagal
                              </span>
                            ) : isReady ? (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-300">
                                <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> Siap
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                                H-{dayPassed}
                              </span>
                            )}
                          </div>

                          <span
                            className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                              isClassic
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {enzymeMeta.label}
                          </span>

                          <h3 className="font-bold text-stone-900 text-xs leading-snug line-clamp-2">
                            {batch.containerName}
                          </h3>

                          <div className="text-[10px] text-stone-600 space-y-0.5 pt-0.5">
                            <div className="truncate">
                              {sweetenerMeta.label}:{' '}
                              <strong className="text-amber-800">{formatWeight(batch.molassesKg)}</strong>
                            </div>
                            <div className="truncate">
                              {enzymeMeta.materialShortLabel}:{' '}
                              <strong className="text-emerald-800">{formatWeight(batch.organicWasteKg)}</strong>
                            </div>
                          </div>
                        </div>

                        {!isArchived && !isHarvested && !isFailed && !isReady ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[9px] font-bold text-stone-600">
                              <span>{progress}%</span>
                              <span>{daysLeft}h lagi</span>
                            </div>
                            <div className="w-full bg-stone-200/80 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-[#FC9634] h-full rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-stone-500 font-medium">
                            {Number(batch.waterLiter)}L •{' '}
                            {isFailed
                              ? 'Fermentasi gagal'
                              : new Date(batch.harvestEstimate).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                          </div>
                        )}

                        <div className="flex flex-col gap-1.5 pt-2 border-t border-stone-200/80">
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveQrBatch(batch);
                                setIsQrModalOpen(true);
                              }}
                              className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-[10px] transition-colors"
                              title="Cetak atau unduh label barcode galon"
                            >
                              <QrCode className="w-3 h-3 text-emerald-700 shrink-0" />
                              <span>QR</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveLogBatch(batch);
                                setIsLogModalOpen(true);
                              }}
                              className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 font-bold text-[10px] transition-colors"
                              title="Catat atau lihat log inspeksi galon"
                            >
                              <ClipboardList className="w-3 h-3 text-[#2C5F2D] shrink-0" />
                              <span>Log</span>
                              {typeof batch._count?.inspectionLogs === 'number' &&
                                batch._count.inspectionLogs > 0 && (
                                  <span className="px-1 rounded-full bg-[#2C5F2D] text-white text-[9px] leading-tight">
                                    {batch._count.inspectionLogs}
                                  </span>
                                )}
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {!isArchived && !isHarvested && !isFailed && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveHarvestBatch(batch);
                                  setIsHarvestModalOpen(true);
                                }}
                                className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[10px] transition-all text-center ${
                                  isReady
                                    ? 'bg-[#012D1D] text-white'
                                    : 'bg-stone-200/70 hover:bg-stone-200 text-stone-700'
                                }`}
                                title="Catat hasil panen"
                              >
                                Panen
                              </button>
                            )}

                            {isArchived ? (
                              <div className="flex items-center gap-1.5 flex-1">
                                <button
                                  type="button"
                                  onClick={() => handleRestore(batch)}
                                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[10px] font-bold transition-colors"
                                  title="Pulihkan dari arsip"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Pulihkan</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPermanentDeleteModal({
                                      isOpen: true,
                                      id: batch.id,
                                      name: `${batch.containerName} (${batch.batchCode || batch.publicCode})`,
                                    });
                                  }}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors shrink-0"
                                  title="Hapus permanen dari database"
                                  aria-label={`Hapus permanen ${batch.containerName}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 ml-auto">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingBatch(batch);
                                    setIsBatchModalOpen(true);
                                  }}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                                  title="Edit data"
                                  aria-label={`Edit ${batch.containerName}`}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteModal({
                                      isOpen: true,
                                      id: batch.id,
                                      name: `${batch.containerName} (${batch.batchCode || batch.publicCode})`,
                                    });
                                  }}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                                  title="Arsipkan galon"
                                  aria-label={`Arsipkan ${batch.containerName}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
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
                      const {
                        dayPassed,
                        progress,
                        daysLeft,
                        isArchived,
                        isHarvested,
                        isFailed,
                        isReady,
                      } = getBatchDisplayState(batch);
                      const enzymeType = normalizeEnzymeType(batch.enzymeType);
                      const enzymeMeta = getEnzymeTypeMeta(enzymeType);
                      const sweetenerMeta = getSweetenerMeta(batch.sweetenerType, enzymeType);
                      const isClassic = enzymeType === 'CLASSIC_ENZYME';
                      const fruits = parseOrganicWasteTypes(batch.organicWasteTypes, enzymeType);

                      return (
                        <tr key={batch.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-4 px-6 align-middle">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-black bg-[#012D1D] text-white px-2 py-0.5 rounded-md">
                                {batch.batchCode || 'GL-01'}
                              </span>
                              <span className="font-bold text-stone-900 text-sm">
                                {batch.containerName}
                              </span>
                              <span
                                className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  isClassic
                                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}
                              >
                                {enzymeMeta.label}
                              </span>
                            </div>
                            {batch.organicWasteTypes && (
                              <p className="text-[11px] text-stone-500 mt-1 max-w-[260px] truncate" title={batch.organicWasteTypes}>
                                {enzymeMeta.materialShortLabel}: {fruits.join(', ')}
                              </p>
                            )}
                          </td>

                          <td className="py-4 px-4 align-middle whitespace-nowrap text-stone-700">
                            <div className="space-y-0.5 text-[11px]">
                              <div>Air: <strong>{Number(batch.waterLiter)} L</strong></div>
                              <div>{sweetenerMeta.label}: <strong className="text-amber-800">{formatWeight(batch.molassesKg)}</strong></div>
                              <div>{enzymeMeta.materialShortLabel}: <strong className="text-emerald-800">{formatWeight(batch.organicWasteKg)}</strong></div>
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
                            ) : isFailed ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                                <AlertCircle className="w-3 h-3" /> Gagal Fermentasi
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

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveLogBatch(batch);
                                  setIsLogModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 font-bold text-xs transition-colors"
                                title="Catat atau lihat log inspeksi galon"
                              >
                                <ClipboardList className="w-3.5 h-3.5 text-[#2C5F2D]" />
                                <span>Log</span>
                                {typeof batch._count?.inspectionLogs === 'number' &&
                                  batch._count.inspectionLogs > 0 && (
                                    <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-[#2C5F2D] text-white text-[10px] leading-none">
                                      {batch._count.inspectionLogs}
                                    </span>
                                  )}
                              </button>

                              {!isArchived && !isHarvested && !isFailed && (
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
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleRestore(batch)}
                                    className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors"
                                    title="Pulihkan dari arsip"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPermanentDeleteModal({
                                        isOpen: true,
                                        id: batch.id,
                                        name: `${batch.containerName} (${batch.batchCode || batch.publicCode})`,
                                      });
                                    }}
                                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    title="Hapus permanen dari database"
                                    aria-label={`Hapus permanen ${batch.containerName}`}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
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
              </>
            )}
          </div>
        </div>
      )}

      {/* ════════════════ TAB 2: VIDEO EDUKASI ECO ENZYME ════════════════ */}
      {activeTab === 'VIDEOS' && (
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Header Video */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-3xl font-black text-stone-900 tracking-tight">
                Kelola Video Edukasi Eco Enzyme
              </h1>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5 sm:mt-1">
                Kelola video panduan manfaat dan cara pembuatan Eco Enzyme yang tampil pada halaman publik.
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => loadVideos()}
                className="p-2 sm:p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors shadow-xs"
                title="Segarkan Data"
                type="button"
              >
                <RefreshCw className={`w-4 h-4 ${isVideoLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handleOpenAddVideo}
                className="inline-flex items-center gap-2 rounded-xl bg-[#012D1D] hover:bg-[#0B4A31] text-white px-4 py-2 sm:px-5 sm:py-2.5 font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95"
                type="button"
              >
                <Plus className="w-4 h-4 text-[#FC9634]" />
                <span>Tambah Video Edukasi</span>
              </button>
            </div>
          </header>

          {/* Statistik Kartu Video */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-stone-200 shadow-xs">
              <span className="text-[10px] sm:text-[11px] font-bold text-stone-400 uppercase tracking-wider block">Total Video</span>
              <span className="text-xl sm:text-2xl font-black text-stone-900 mt-0.5 sm:mt-1 block">{videoStats.all}</span>
            </div>
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-stone-200 shadow-xs">
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">MP4 Lokal</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-800 mt-0.5 sm:mt-1 block">{videoStats.local}</span>
            </div>
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-stone-200 shadow-xs">
              <span className="text-[10px] sm:text-[11px] font-bold text-red-600 uppercase tracking-wider block">YouTube</span>
              <span className="text-xl sm:text-2xl font-black text-red-700 mt-0.5 sm:mt-1 block">{videoStats.youtube}</span>
            </div>
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-stone-200 shadow-xs">
              <span className="text-[10px] sm:text-[11px] font-bold text-stone-600 uppercase tracking-wider block">TikTok / IG</span>
              <span className="text-xl sm:text-2xl font-black text-stone-800 mt-0.5 sm:mt-1 block">{videoStats.tiktok + videoStats.instagram}</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="rounded-xl sm:rounded-2xl border border-stone-200 bg-white p-2.5 sm:p-3 shadow-xs space-y-2.5 sm:space-y-3">
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
              {VIDEO_PLATFORM_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setVideoPlatformFilter(tab.id)}
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
            hasActiveFilter={Boolean(videoSearchTerm.trim() || videoPlatformFilter !== 'ALL')}
            onResetFilter={() => {
              setVideoSearchTerm('');
              setVideoPlatformFilter('ALL');
            }}
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
        onQrPrinted={() => {
          void loadData(true);
        }}
        onQrSaved={(savedQr) => {
          setActiveQrBatch((prev) =>
            prev
              ? {
                  ...prev,
                  qrCodeId: savedQr.id,
                  qrCode: savedQr,
                  publicCode: savedQr.code || prev.publicCode,
                }
              : prev
          );
          setBatches((prev) =>
            prev.map((b) =>
              b.id === activeQrBatch?.id
                ? {
                    ...b,
                    qrCodeId: savedQr.id,
                    qrCode: savedQr,
                    publicCode: savedQr.code || b.publicCode,
                  }
                : b
            )
          );
        }}
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

      {/* 3b. Modal Log Inspeksi Galon */}
      <EcoEnzymeLogModal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false);
          setActiveLogBatch(null);
        }}
        batch={activeLogBatch}
        onRefreshBatch={() => {
          void loadData(true);
        }}
      />

      {/* 4. Modal Konfirmasi Arsip Galon */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          if (!isArchivingBatch) setDeleteModal({ isOpen: false, id: '', name: '' });
        }}
        onConfirm={confirmArchive}
        title="Arsipkan Galon Eco Enzyme"
        itemName={deleteModal.name}
        confirmText="Arsipkan Galon"
        description="Galon ini akan dipindahkan ke arsip. QR Code pada fisik galon tetap dapat dipindai oleh warga."
        isDeleting={isArchivingBatch}
      />

      {/* 4b. Modal Konfirmasi Hapus Permanen Galon */}
      <DeleteModal
        isOpen={permanentDeleteModal.isOpen}
        onClose={() => {
          if (!isDeletingPermanently) setPermanentDeleteModal({ isOpen: false, id: '', name: '' });
        }}
        onConfirm={confirmPermanentDelete}
        title="Hapus Permanen Galon Eco Enzyme?"
        itemName={permanentDeleteModal.name}
        confirmText="Hapus Permanen"
        description="PERINGATAN: Galon ini akan dihapus secara PERMANEN dari database beserta seluruh riwayat inspeksinya. QR Code tidak dapat digunakan lagi untuk galon ini. Tindakan ini TIDAK DAPAT dibatalkan."
        isDeleting={isDeletingPermanently}
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
        onClose={() => {
          if (!isDeletingVideo) setVideoDeleteModal({ isOpen: false, video: null });
        }}
        onConfirm={handleDeleteVideoConfirm}
        title="Hapus Video Edukasi Eco Enzyme"
        itemName={videoDeleteModal.video?.title || ''}
        confirmText="Hapus Video"
        description="Video edukasi ini akan dihapus permanen dari daftar dan tidak akan tampil lagi di halaman Eco Enzyme."
        isDeleting={isDeletingVideo}
      />

      {/* 7. Modal Preview Video Player */}
      {previewVideo && (() => {
        const isWide = previewVideo.aspect === 'wide';
        const ytId = extractYouTubeVideoId(previewVideo.videoUrl);
        const directVideo = isDirectVideoSource(previewVideo);
        const safeExternalUrl = getSafeExternalUrl(previewVideo.videoUrl);
        const thumbUrl = previewVideo.thumbnail
          ? getEcoEnzymeVideoThumbnailUrl(previewVideo.thumbnail)
          : '';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2.5 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div
              className={`bg-stone-900 rounded-2xl sm:rounded-3xl ${
                isWide ? 'max-w-2xl' : 'max-w-lg'
              } w-full p-3.5 sm:p-5 shadow-2xl border border-stone-700 relative text-white space-y-2.5 sm:space-y-3`}
            >
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
                  type="button"
                  onClick={() => setPreviewVideo(null)}
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div
                className={`relative ${
                  isWide ? 'aspect-video' : 'aspect-[9/13] max-h-[70vh]'
                } w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center`}
              >
                {directVideo ? (
                  <video
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                    src={previewVideo.videoUrl}
                  >
                    Browser tidak mendukung video HTML5.
                  </video>
                ) : ytId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                    title={previewVideo.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-stone-950">
                    {thumbUrl && (
                      <img
                        src={thumbUrl}
                        alt={previewVideo.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-25"
                      />
                    )}
                    <div className="relative z-10 flex flex-col items-center gap-3 max-w-xs">
                      <span className="px-3 py-1 rounded-full bg-white/15 text-[11px] font-bold uppercase tracking-wider text-[#FC9634]">
                        {previewVideo.platform}
                      </span>
                      <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
                        Pratinjau langsung tidak tersedia di modal untuk tautan eksternal {previewVideo.platform}.
                      </p>
                      {safeExternalUrl ? (
                        <a
                          href={safeExternalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FC9634] hover:bg-[#e58425] text-[#012D1D] text-xs font-bold shadow-md transition-colors"
                        >
                          <span>Buka Video di {previewVideo.platform}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-xs text-rose-400">
                          Tautan video tidak valid.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {previewVideo.description && (
                <p className="text-xs text-stone-300 leading-relaxed pt-1">
                  {previewVideo.description}
                </p>
              )}
            </div>
          </div>
        );
      })()}

    </div>
  );
}
