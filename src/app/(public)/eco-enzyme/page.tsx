'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  QrCode,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  Droplet,
  Scale,
  Apple,
  ArrowRight,
  ExternalLink,
  X,
  AlertCircle,
  HelpCircle,
  Leaf,
  Play,
  Film,
  Calculator,
} from 'lucide-react';
import { EcoEnzymeQrModal } from '@/components/admin/EcoEnzymeQrModal';
import { SafeImage } from '@/components/shared/SafeImage';
import { ecoEnzymeApi } from '@/lib/api/eco-enzyme';
import { ecoEnzymeVideoApi, getEcoEnzymeVideoThumbnailUrl } from '@/lib/api/eco-enzyme-video';
import { EcoEnzymeBatch, EcoEnzymeVideoItem, EnzymeType } from '@/types';
import {
  getDaysRemaining,
  getFermentationProgress,
  getDayPassed,
  getEnzymeTypeMeta,
  getSweetenerMeta,
  normalizeEnzymeType,
  parseOrganicWasteTypes,
} from '@/lib/eco-enzyme';
import { buildBatchPath } from '@/lib/batch-url';
import { OutlineLeaf, ConcentricCircles } from '@/components/ui/DecorativeElements';

type BatchStatusFilter = 'ALL' | 'FERMENTING' | 'READY' | 'HARVESTED';
type BatchTypeFilter = 'ALL' | EnzymeType;

const STATUS_FILTER_TABS: ReadonlyArray<{ id: BatchStatusFilter; label: string }> = [
  { id: 'ALL', label: 'Semua' },
  { id: 'FERMENTING', label: 'Fermentasi' },
  { id: 'READY', label: 'Siap Panen' },
  { id: 'HARVESTED', label: 'Dipanen' },
];

const TYPE_FILTER_TABS: ReadonlyArray<{ id: BatchTypeFilter; label: string }> = [
  { id: 'ALL', label: 'Semua Jenis' },
  { id: 'ECO_ENZYME', label: 'Eco Enzyme' },
  { id: 'CLASSIC_ENZYME', label: 'Classic Enzyme' },
];

function isLocalVideoSource(videoUrl?: string | null, platform?: string | null): boolean {
  if (platform === 'Local') return true;
  const trimmed = videoUrl?.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true;
  const pathWithoutQuery = trimmed.split(/[?#]/)[0].toLowerCase();
  return pathWithoutQuery.endsWith('.mp4') || pathWithoutQuery.endsWith('.webm');
}

function extractYouTubeId(rawUrl?: string | null): string | null {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com' ||
      host === 'youtube-nocookie.com'
    ) {
      const vParam = parsed.searchParams.get('v');
      if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
        return vParam;
      }

      const segments = parsed.pathname.split('/').filter(Boolean);
      if (
        segments.length >= 2 &&
        ['embed', 'shorts', 'live', 'v'].includes(segments[0].toLowerCase())
      ) {
        const candidate = segments[1];
        return /^[a-zA-Z0-9_-]{11}$/.test(candidate) ? candidate : null;
      }
    }
  } catch {
    // Fallback regex below
  }

  const match = trimmed.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  return match ? match[1] : null;
}

function isSafeExternalVideoUrl(rawUrl?: string | null): boolean {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    (trimmed.startsWith('/') && !trimmed.startsWith('//'))
  );
}

function formatEcoWeight(kg: number): string {
  if (kg <= 0 || !Number.isFinite(kg)) return '0 gr';
  if (kg < 1) {
    return `${Math.round(kg * 1000).toLocaleString('id-ID')} gr`;
  }
  return `${Number(kg.toFixed(2)).toLocaleString('id-ID')} kg`;
}

function formatEcoLiter(liter: number): string {
  if (liter <= 0 || !Number.isFinite(liter)) return '0 L';
  return `${Number(liter.toFixed(2)).toLocaleString('id-ID')} L`;
}

const DEFAULT_EDUCATION_VIDEOS: EcoEnzymeVideoItem[] = [
  {
    id: 'default-1',
    title: 'VIDIO MANFAAT ECO ENZYM',
    description:
      'Mengenal ragam manfaat luar biasa cairan fermentasi Eco Enzyme untuk pembersih alami serbaguna, pupuk penyubur tanaman, pengusir hama ramah lingkungan, dan pembersih udara.',
    videoUrl: '/videos/vidio-manfaat-eco-enzym.mp4',
    category: 'Manfaat & Khasiat',
    platform: 'Local',
    duration: '01:46',
    isActive: true,
    sortOrder: 1,
    tags: ['Pembersih Alami', 'Pupuk Organik', 'Ramah Lingkungan'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-2',
    title: 'VIDIO PEMBUATAN ECO ENZYM',
    description:
      'Tutorial langkah demi langkah mempraktikkan formula emas 1 Bagian Gula/Madu : 3 Bagian Kulit Buah : 10 Bagian Air, mulai dari penyiapan bahan hingga proses fermentasi selama 90 hari.',
    videoUrl: '/videos/vidio-pembuatan-eco-enzym.mp4',
    category: 'Panduan Pembuatan',
    platform: 'Local',
    duration: '01:12',
    isActive: true,
    sortOrder: 2,
    tags: ['Takaran Rumus 1:3:10', 'Kulit Buah Segar', 'Fermentasi 90 Hari'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function EcoEnzymePublicPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<EcoEnzymeBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BatchStatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<BatchTypeFilter>('ALL');
  const [selectedBatchForLabel, setSelectedBatchForLabel] = useState<EcoEnzymeBatch | null>(null);
  const [educationVideos, setEducationVideos] = useState<EcoEnzymeVideoItem[]>(DEFAULT_EDUCATION_VIDEOS);
  const [calcEnzymeType, setCalcEnzymeType] = useState<EnzymeType>('ECO_ENZYME');
  const [calcMode, setCalcMode] = useState<'capacity' | 'waste'>('capacity');
  const [calcInput, setCalcInput] = useState<string>('15');
  const inlineVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const [activeEducationVideo, setActiveEducationVideo] = useState<{
    title: string;
    category: string;
    src: string;
    duration: string;
    description: string;
    platform?: string;
    aspect?: string | null;
  } | null>(null);

  useEffect(() => {
    if (!activeEducationVideo) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveEducationVideo(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeEducationVideo]);

  const openEducationVideoModal = (video: EcoEnzymeVideoItem) => {
    // Pause any inline HTML5 video playing so audio does not overlap with fullscreen modal
    Object.values(inlineVideoRefs.current).forEach((el) => {
      if (el && !el.paused) {
        el.pause();
      }
    });

    setActiveEducationVideo({
      title: video.title,
      category: video.category || 'Edukasi Eco Enzyme',
      src: video.videoUrl,
      duration: video.duration || '00:00',
      description: video.description || '',
      platform: video.platform,
      aspect: video.aspect,
    });
  };

  useEffect(() => {
    async function loadBatches() {
      try {
        const data = await ecoEnzymeApi.getAll();
        if (data) {
          const activeOnly = data.filter((b) => !b.archivedAt && b.status !== 'ARCHIVED');
          setBatches(activeOnly);
        }
      } catch (err) {
        console.error('Gagal memuat data galon eco enzyme:', err);
      } finally {
        setLoading(false);
      }
    }

    async function loadVideos() {
      try {
        const vData = await ecoEnzymeVideoApi.getAll({ limit: 100 });
        if (vData && vData.length > 0) {
          const activeOnly = vData.filter((v) => v.isActive !== false);
          setEducationVideos(activeOnly.length > 0 ? activeOnly : DEFAULT_EDUCATION_VIDEOS);
        }
      } catch (err) {
        console.error('Gagal memuat video edukasi eco enzyme:', err);
      }
    }

    loadBatches();
    loadVideos();
  }, []);

  const calcResult = useMemo(() => {
    const parsed = Number.parseFloat(calcInput.replace(',', '.'));
    const value = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;

    if (calcMode === 'capacity') {
      const waterLiter = value * 0.6;
      const molassesKg = waterLiter / 10;
      const organicWasteKg = (waterLiter * 3) / 10;
      return {
        waterLiter,
        molassesKg,
        organicWasteKg,
        recommendedContainerLiter: value,
      };
    }

    const organicWasteKg = value;
    const unitPartKg = organicWasteKg / 3;
    const molassesKg = unitPartKg;
    const waterLiter = unitPartKg * 10;
    const recommendedContainerLiter = waterLiter > 0 ? waterLiter / 0.6 : 0;
    return {
      waterLiter,
      molassesKg,
      organicWasteKg,
      recommendedContainerLiter,
    };
  }, [calcMode, calcInput]);

  const handleCalcModeChange = (nextMode: 'capacity' | 'waste') => {
    if (nextMode === calcMode) return;
    if (nextMode === 'waste') {
      const nextVal =
        calcResult.organicWasteKg > 0
          ? String(Number(calcResult.organicWasteKg.toFixed(2)))
          : '1.5';
      setCalcInput(nextVal);
    } else {
      const nextVal =
        calcResult.recommendedContainerLiter > 0
          ? String(Number(calcResult.recommendedContainerLiter.toFixed(1)))
          : '15';
      setCalcInput(nextVal);
    }
    setCalcMode(nextMode);
  };

  // Filter galon berdasarkan pencarian, jenis enzyme, dan status
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const batchEnzymeType = normalizeEnzymeType(b.enzymeType);
      if (typeFilter !== 'ALL' && batchEnzymeType !== typeFilter) return false;

      const q = searchQuery.toLowerCase().trim();
      const code = (b.batchCode || '').toLowerCase();
      const pub = (b.publicCode || '').toLowerCase();
      const name = (b.containerName || '').toLowerCase();
      const fruits = (b.organicWasteTypes || '').toLowerCase();
      const enzymeLabel = getEnzymeTypeMeta(batchEnzymeType).label.toLowerCase();
      const sweetenerLabel = getSweetenerMeta(b.sweetenerType, batchEnzymeType).label.toLowerCase();

      const matchSearch =
        !q ||
        code.includes(q) ||
        pub.includes(q) ||
        name.includes(q) ||
        fruits.includes(q) ||
        enzymeLabel.includes(q) ||
        sweetenerLabel.includes(q);

      if (!matchSearch) return false;

      const isFailed = b.status === 'FAILED' || b.displayStatus === 'FAILED';
      const isHarvested =
        !isFailed && (b.status === 'HARVESTED' || b.displayStatus === 'HARVESTED');
      const isReady =
        !isFailed &&
        !isHarvested &&
        (b.displayStatus === 'READY_TO_HARVEST' ||
          getFermentationProgress(b.startDate, b.harvestEstimate) >= 100);
      const isFermenting = !isFailed && !isHarvested && !isReady;

      if (statusFilter === 'FERMENTING') return isFermenting;
      if (statusFilter === 'READY') return isReady;
      if (statusFilter === 'HARVESTED') return isHarvested;

      return true;
    });
  }, [batches, searchQuery, statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      document.getElementById('galon-tracker')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Cek apakah ada kecocokan persis pada kode galon atau nama wadah
    const lowerQ = q.toLowerCase();
    const exactMatch = batches.find(
      (b) =>
        b.batchCode?.toLowerCase() === lowerQ ||
        b.publicCode?.toLowerCase() === lowerQ ||
        b.containerName?.toLowerCase() === lowerQ
    );

    if (exactMatch) {
      router.push(buildBatchPath(exactMatch.publicCode));
    } else {
      // Pencarian parsial memfilter daftar di halaman yang sama lalu gulir ke bagian galon tracker
      document.getElementById('galon-tracker')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-900">
      
      {/* ════════════════ HERO SECTION ════════════════ */}
      <section className="relative overflow-hidden bg-[#012D1D] text-white pt-20 pb-10 md:pt-36 md:pb-20 px-3 sm:px-6 lg:px-8">
        {/* Figma Frame 48 Brand Background Ornaments */}
        <div className="absolute -right-20 -top-16 opacity-15 pointer-events-none rotate-[20deg]">
          <OutlineLeaf size={380} color="#203220" strokeWidth={6.72} />
        </div>
        <div className="absolute -left-20 -bottom-24 opacity-20 pointer-events-none">
          <ConcentricCircles size={320} color="#FC9634" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-white/10 text-emerald-300 text-[11px] sm:text-xs font-semibold backdrop-blur-sm border border-white/10">
            <Leaf className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            Transparansi Fermentasi Komunitas Teman Pilah
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Pemantauan Fermentasi <span className="text-[#FC9634]">Eco &amp; Classic Enzyme</span>
          </h1>

          <p className="text-xs sm:text-base text-stone-200/90 max-w-2xl mx-auto leading-relaxed">
            Pantau langsung fermentasi <strong>Eco Enzyme</strong> (dibuat dari bahan organik seperti kulit buah pilihan dengan pemanis Molase/Gula) maupun <strong>Classic Enzyme</strong> (dibuat dari buah segar pilihan dan berkualitas dengan pemanis Madu/Gula) pada setiap galon.
            Pindai barcode pada fisik galon atau masukkan kodenya di bawah ini.
          </p>

          {/* LOOKUP SEARCH BAR */}
          <form
            onSubmit={handleSearchSubmit}
            className="pt-2 sm:pt-4 max-w-xl mx-auto flex flex-col sm:flex-row gap-2 sm:gap-2.5"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Masukkan Kode Galon (contoh: GL-01, Galon 1, EE-2610)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-stone-900 pl-10 sm:pl-11 pr-3.5 sm:pr-4 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-medium shadow-lg placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FC9634]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3.5 bg-[#FC9634] hover:bg-[#e88523] text-stone-950 font-black rounded-xl sm:rounded-2xl text-xs sm:text-sm shadow-lg transition-transform active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              Cek Galon
            </button>
          </form>

          <p className="text-[10px] sm:text-[11px] text-stone-300/80 pt-0.5 sm:pt-1 flex items-center justify-center gap-1.5">
            <HelpCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-400 shrink-0" />
            Setiap galon fisik memiliki stiker QR Code yang bisa discan langsung dengan kamera ponsel.
          </p>
        </div>
      </section>

      {/* ════════════════ FORMULA 1:3:10 RINGKAS & KALKULATOR ════════════════ */}
      <section
        id="kalkulator"
        className="max-w-5xl mx-auto px-3 sm:px-6 -mt-6 sm:-mt-8 relative z-20 scroll-mt-20"
      >
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-xl border border-stone-200/80 space-y-4 sm:space-y-5">
          {/* Toggle Eco Enzyme vs Classic Enzyme */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-stone-200/70">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-stone-600">
              <span className="font-bold text-stone-800">Pilih Jenis Enzim:</span>
              <span className="text-stone-500">
                {calcEnzymeType === 'ECO_ENZYME'
                  ? 'Bahan organik seperti kulit buah pilihan • Molase / Gula'
                  : 'Buah segar pilihan dan berkualitas • Madu / Gula'}
              </span>
            </div>

            <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200/80 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setCalcEnzymeType('ECO_ENZYME')}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                  calcEnzymeType === 'ECO_ENZYME'
                    ? 'bg-[#012D1D] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Leaf className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                Eco Enzyme
              </button>
              <button
                type="button"
                onClick={() => setCalcEnzymeType('CLASSIC_ENZYME')}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                  calcEnzymeType === 'CLASSIC_ENZYME'
                    ? 'bg-[#B45309] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                Classic Enzyme
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-3.5 sm:gap-5">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#3B9734] block">
                Standar Rumus Alami • {calcEnzymeType === 'ECO_ENZYME' ? 'Eco Enzyme' : 'Classic Enzyme'}
              </span>
              <h3 className="text-sm sm:text-lg font-black text-stone-900">
                Formula Emas 1 : 3 : 10 (90 Hari)
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-500 max-w-sm leading-relaxed">
                {calcEnzymeType === 'ECO_ENZYME'
                  ? 'Dibuat dari bahan organik seperti kulit buah pilihan dengan pemanis Molase atau Gula.'
                  : 'Dibuat dari buah segar pilihan dan berkualitas dengan pemanis Madu atau Gula.'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full md:w-auto">
              <div className="bg-[#FFF8F0] border border-[#FDE3C7] rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center min-w-0">
                <div className="text-xs sm:text-lg font-black text-[#B45309] whitespace-nowrap">1 Bagian</div>
                <div className="text-[10px] sm:text-[11px] font-bold text-stone-800 mt-0.5">Pemanis</div>
                <div className="text-[9px] sm:text-[10px] text-stone-500 leading-tight">
                  {calcEnzymeType === 'ECO_ENZYME' ? 'Molase / Gula' : 'Madu / Gula'}
                </div>
              </div>

              <div className="bg-[#F0F8EE] border border-[#CFE7CA] rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center min-w-0">
                <div className="text-xs sm:text-lg font-black text-[#2C5F2D] whitespace-nowrap">3 Bagian</div>
                <div className="text-[10px] sm:text-[11px] font-bold text-stone-800 mt-0.5">
                  {calcEnzymeType === 'ECO_ENZYME' ? 'Bahan Organik' : 'Buah Segar Pilihan'}
                </div>
                <div className="text-[9px] sm:text-[10px] text-stone-500 leading-tight">
                  {calcEnzymeType === 'ECO_ENZYME' ? '(Kulit Buah Pilihan)' : '(Buah Berkualitas)'}
                </div>
              </div>

              <div className="bg-[#F0F7FC] border border-[#CEE3F5] rounded-xl sm:rounded-2xl p-2 sm:p-3 text-center min-w-0">
                <div className="text-xs sm:text-lg font-black text-[#0369A1] whitespace-nowrap">10 Bagian</div>
                <div className="text-[10px] sm:text-[11px] font-bold text-stone-800 mt-0.5">Air Bersih</div>
                <div className="text-[9px] sm:text-[10px] text-stone-500 leading-tight">
                  {calcEnzymeType === 'ECO_ENZYME' ? 'Air Sumur/AC' : 'Air Matang/Mineral'}
                </div>
              </div>
            </div>
          </div>

          {/* KALKULATOR INTERAKTIF 1:3:10 */}
          <div className="pt-4 sm:pt-5 border-t border-stone-200/80 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#2C5F2D] shrink-0">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-stone-900">
                    Kalkulator Takaran {calcEnzymeType === 'ECO_ENZYME' ? 'Eco Enzyme' : 'Classic Enzyme'}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-stone-500">
                    {calcEnzymeType === 'ECO_ENZYME'
                      ? 'Hitung otomatis kebutuhan Molase / Gula, Bahan Organik (Kulit Buah Pilihan), dan Air.'
                      : 'Hitung otomatis kebutuhan Madu / Gula, Buah Segar Pilihan, dan Air.'}
                  </p>
                </div>
              </div>

              <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200/80 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleCalcModeChange('capacity')}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                    calcMode === 'capacity'
                      ? 'bg-[#012D1D] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Kapasitas Wadah (L)
                </button>
                <button
                  type="button"
                  onClick={() => handleCalcModeChange('waste')}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all ${
                    calcMode === 'waste'
                      ? 'bg-[#012D1D] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {calcEnzymeType === 'ECO_ENZYME' ? 'Berat Sampah (Kg)' : 'Berat Buah (Kg)'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-center">
              {/* Input Control */}
              <div className="lg:col-span-5 bg-[#FAFBF9] border border-stone-200 rounded-xl sm:rounded-2xl p-3 space-y-2">
                <label
                  htmlFor="eco-enzyme-calc-input"
                  className="block text-[11px] font-bold text-stone-700"
                >
                  {calcMode === 'capacity'
                    ? 'Masukkan Kapasitas Wadah / Galon (Liter)'
                    : calcEnzymeType === 'ECO_ENZYME'
                    ? 'Masukkan Berat Sampah Organik / Kulit Buah/Sayur (Kg)'
                    : 'Masukkan Berat Buah Segar Pilihan (Kg)'}
                </label>

                <div className="flex items-center">
                  <input
                    id="eco-enzyme-calc-input"
                    type="number"
                    min="0"
                    step="any"
                    value={calcInput}
                    onChange={(e) => setCalcInput(e.target.value)}
                    placeholder={calcMode === 'capacity' ? 'cth. 15' : 'cth. 1.5'}
                    className="w-full text-sm font-black text-stone-900 bg-white border border-stone-300 rounded-l-xl px-3 py-2 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
                  />
                  <span className="bg-stone-200 text-stone-800 px-3 py-2 text-xs font-bold rounded-r-xl border border-l-0 border-stone-300">
                    {calcMode === 'capacity' ? 'Liter' : 'Kg'}
                  </span>
                </div>

                {/* Preset Cepat */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-medium text-stone-400 mr-0.5">
                    Cepat:
                  </span>
                  {(calcMode === 'capacity'
                    ? ['5', '10', '15', '19']
                    : ['0.5', '1', '1.5', '3']
                  ).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCalcInput(preset)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors ${
                        calcInput === preset
                          ? 'bg-emerald-700 text-white border-emerald-700'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-400'
                      }`}
                    >
                      {preset} {calcMode === 'capacity' ? 'L' : 'Kg'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculated Outputs */}
              <div className="lg:col-span-7 grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-[#FFF8F0] border border-[#FDE3C7] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-center">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-[#B45309] block">
                    {calcEnzymeType === 'ECO_ENZYME' ? 'Molase / Gula' : 'Madu / Gula'}
                  </span>
                  <div className="text-sm sm:text-xl font-black text-stone-900 mt-1">
                    {formatEcoWeight(calcResult.molassesKg)}
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-stone-500 block mt-0.5">
                    1 Bagian
                  </span>
                </div>

                <div className="bg-[#F0F8EE] border border-[#CFE7CA] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-center">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-[#2C5F2D] block leading-tight">
                    {calcEnzymeType === 'ECO_ENZYME'
                      ? 'Bahan Organik (Kulit Buah Pilihan)'
                      : 'Buah Segar Pilihan'}
                  </span>
                  <div className="text-sm sm:text-xl font-black text-stone-900 mt-1">
                    {formatEcoWeight(calcResult.organicWasteKg)}
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-stone-500 block mt-0.5">
                    {calcEnzymeType === 'ECO_ENZYME' ? '3 Bagian (BO)' : '3 Bagian (Buah Segar)'}
                  </span>
                </div>

                <div className="bg-[#F0F7FC] border border-[#CEE3F5] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-center">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-[#0369A1] block">
                    Air Bersih
                  </span>
                  <div className="text-sm sm:text-xl font-black text-stone-900 mt-1">
                    {formatEcoLiter(calcResult.waterLiter)}
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-stone-500 block mt-0.5">
                    10 Bagian
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[10px] sm:text-[11px] text-stone-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FC9634] shrink-0" />
              {calcMode === 'capacity' ? (
                <span>
                  Takaran air dihitung <strong>60% kapasitas wadah</strong> agar menyisakan ruang udara bagi gas fermentasi selama 90 hari.
                </span>
              ) : (
                <span>
                  Disarankan memakai wadah minimal{' '}
                  <strong>
                    {formatEcoLiter(Math.ceil(calcResult.recommendedContainerLiter))}
                  </strong>{' '}
                  agar tersedia ruang aman untuk gas fermentasi.
                </span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════ VIDEO EDUKASI ECO ENZYME ════════════════ */}
      <section className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-10 md:pt-14 pb-2">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 md:p-10 border border-stone-200/90 shadow-sm relative overflow-hidden">
          {/* Subtle Decorative Background Leaf */}
          <div className="absolute -right-20 -bottom-20 opacity-10 pointer-events-none rotate-12">
            <OutlineLeaf size={280} color="#203220" strokeWidth={6.72} />
          </div>

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 pb-4 md:pb-8 border-b border-stone-100 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-50 text-emerald-800 text-[10px] sm:text-xs font-bold border border-emerald-200 mb-1.5 sm:mb-2">
                <Film className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
                Video Edukasi Komunitas
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-stone-900 tracking-tight">
                Video Edukasi <span className="text-[#2C5F2D]">Eco Enzyme</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-xl leading-relaxed">
                Tonton panduan visual mengenai manfaat luar biasa serta tata cara pembuatan Eco Enzyme alami menggunakan limbah organik dapur Anda.
              </p>
            </div>
            <div className="text-[10px] sm:text-[11px] font-semibold text-stone-500 bg-stone-50 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-stone-200 flex items-center gap-1.5 sm:gap-2 self-start md:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {educationVideos.length} Video Panduan Tersedia
            </div>
          </div>

          {/* Dynamic Video Cards Grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-6 md:gap-8 pt-4 sm:pt-8 relative z-10">
            {educationVideos.map((video, idx) => {
              const isLocal = isLocalVideoSource(video.videoUrl, video.platform);
              const videoRefKey = video.id || String(idx);

              return (
                <div
                  key={video.id || idx}
                  className="bg-[#FAFBF9] rounded-xl sm:rounded-3xl p-2 sm:p-5 border border-stone-200/90 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group min-w-0"
                >
                  <div className="space-y-2.5 sm:space-y-4">
                    {/* Video Player Frame */}
                    <div className="relative aspect-[9/12] sm:aspect-[9/13] max-h-[220px] sm:max-h-[480px] w-full rounded-xl sm:rounded-2xl overflow-hidden bg-stone-950 shadow-inner flex items-center justify-center">
                      {isLocal ? (
                        <video
                          ref={(el) => {
                            inlineVideoRefs.current[videoRefKey] = el;
                          }}
                          controls
                          preload="metadata"
                          playsInline
                          className="w-full h-full object-contain bg-black rounded-xl sm:rounded-2xl"
                          src={video.videoUrl}
                        >
                          Browser Anda tidak mendukung pemutar video HTML5.
                        </video>
                      ) : (
                        <div className="relative w-full h-full bg-stone-900 group/thumb">
                          {video.thumbnail ? (
                            <SafeImage
                              src={getEcoEnzymeVideoThumbnailUrl(video.thumbnail)}
                              fallbackSrc="/activity/Pengmas (1).jpeg"
                              alt={video.title}
                              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-stone-800 text-stone-400">
                              <Film className="w-8 h-8 sm:w-12 sm:h-12 mb-1 sm:mb-2 text-stone-500" />
                              <span className="text-[10px] sm:text-xs font-semibold">{video.platform || 'Video'}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 group-hover/thumb:bg-black/20 transition-colors flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => openEducationVideoModal(video)}
                              className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-[#FC9634] hover:bg-[#e8801a] hover:scale-110 flex items-center justify-center text-[#012D1D] shadow-xl transition-all"
                              aria-label={`Putar video ${video.title}`}
                            >
                              <Play className="w-4 h-4 sm:w-6 sm:h-6 fill-[#012D1D] ml-0.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Badges Overlay */}
                      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 pointer-events-none max-w-[calc(100%-3.25rem)]">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold max-w-full truncate">
                          {idx % 2 === 0 ? (
                            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#FC9634] shrink-0" />
                          ) : (
                            <Scale className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#FC9634] shrink-0" />
                          )}
                          <span className="truncate">{video.category || 'Eco Enzyme'}</span>
                        </span>
                      </div>
                      {video.duration && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 pointer-events-none">
                          <span className="px-1.5 py-0.5 sm:px-2 rounded-md bg-black/60 backdrop-blur-md text-stone-200 font-mono text-[9px] sm:text-[10px] font-bold">
                            {video.duration}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Video Meta & Details */}
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[11px] font-bold text-emerald-800">
                        <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 truncate max-w-full">
                          {video.category || 'Panduan'}
                        </span>
                        {video.duration && (
                          <>
                            <span className="hidden sm:inline text-stone-300">•</span>
                            <span className="hidden sm:inline text-stone-500 font-normal">Durasi {video.duration}</span>
                          </>
                        )}
                        <span className="hidden sm:inline text-stone-300">•</span>
                        <span className="hidden sm:inline text-stone-400 font-normal">{video.platform}</span>
                      </div>

                      <h3 className="text-xs sm:text-lg font-black text-stone-900 group-hover:text-emerald-800 transition-colors line-clamp-2 leading-snug">
                        {video.title}
                      </h3>

                      <p className="text-[11px] sm:text-xs text-stone-600 leading-relaxed line-clamp-2 sm:line-clamp-3">
                        {video.description}
                      </p>

                      {video.tags && video.tags.length > 0 && (
                        <div className="pt-0.5 sm:pt-1 flex flex-wrap gap-1 sm:gap-1.5 text-[9px] sm:text-[10px]">
                          {video.tags.map((tag: string, tIdx: number) => (
                            <span
                              key={tIdx}
                              className={`${
                                tIdx >= 2 ? 'hidden sm:inline-block' : 'inline-block'
                              } bg-white px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg border border-stone-200 text-stone-700 font-medium max-w-full truncate`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2.5 sm:pt-4 mt-2 sm:mt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
                    <span className="hidden sm:inline text-[11px] text-stone-400 font-medium">
                      Komunitas Teman Pilah
                    </span>
                    <button
                      type="button"
                      onClick={() => openEducationVideoModal(video)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] sm:text-xs font-bold transition-colors"
                    >
                      <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current shrink-0" />
                      <span className="sm:hidden">Layar Penuh</span>
                      <span className="hidden sm:inline">Buka di Layar Penuh</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════ DAFTAR GALON KOMUNITAS ════════════════ */}
      <section
        id="galon-tracker"
        className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-8 md:py-16 space-y-4 sm:space-y-6 scroll-mt-20"
      >
        
        {/* Top Control Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 sm:gap-4 pb-3 border-b border-stone-200">
          <div>
            <h2 className="text-xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Manajemen <span className="text-[#2C5F2D]">Eco &amp; Classic Enzyme</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Daftar seluruh galon Eco Enzyme maupun Classic Enzyme yang sedang aktif difermentasi maupun telah dipanen.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col lg:items-end gap-2 max-w-full">
            {/* Filter Jenis Enzim */}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-emerald-950/5 border border-emerald-900/10 p-1 rounded-2xl self-start lg:self-end max-w-full overflow-x-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TYPE_FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTypeFilter(tab.id)}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    typeFilter === tab.id
                      ? 'bg-[#012D1D] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Filter Status Tabs */}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-stone-200/60 p-1 rounded-2xl self-start lg:self-end max-w-full overflow-x-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {STATUS_FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    statusFilter === tab.id
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div className="text-center py-14 sm:py-20 bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-sm space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-stone-600">Memuat data galon...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredBatches.length === 0 && (
          <div className="text-center py-12 sm:py-16 bg-white rounded-2xl sm:rounded-3xl border border-dashed border-stone-300 p-5 sm:p-6 space-y-3">
            <AlertCircle className="w-10 h-10 text-stone-400 mx-auto" />
            <h3 className="text-sm font-bold text-stone-800">Tidak ada galon yang sesuai</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {searchQuery.trim()
                ? `Tidak ditemukan galon dengan kata kunci "${searchQuery.trim()}". Coba periksa kembali kode galon atau filter jenis/status.`
                : typeFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Tidak ditemukan galon pada jenis atau status fermentasi yang dipilih.'
                : 'Belum ada data galon fermentasi yang terdaftar.'}
            </p>
            {(searchQuery.trim() !== '' || statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setTypeFilter('ALL');
                }}
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 transition-colors"
              >
                Reset Pencarian &amp; Filter
              </button>
            )}
          </div>
        )}

        {/* GALLON CARDS GRID */}
        {!loading && filteredBatches.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-5">
            {filteredBatches.map((batch) => {
              const enzymeType = normalizeEnzymeType(batch.enzymeType);
              const enzymeMeta = getEnzymeTypeMeta(enzymeType);
              const sweetenerMeta = getSweetenerMeta(batch.sweetenerType, enzymeType);
              const isClassic = enzymeType === 'CLASSIC_ENZYME';
              const dayPassed = getDayPassed(batch.startDate);
              const daysLeft = getDaysRemaining(batch.harvestEstimate);
              const fruits = parseOrganicWasteTypes(batch.organicWasteTypes, enzymeType);

              const isFailed =
                batch.status === 'FAILED' || batch.displayStatus === 'FAILED';
              const isHarvested =
                !isFailed &&
                (batch.status === 'HARVESTED' || batch.displayStatus === 'HARVESTED');
              const progress = isHarvested
                ? 100
                : getFermentationProgress(batch.startDate, batch.harvestEstimate);
              const isReady =
                !isFailed &&
                !isHarvested &&
                (batch.displayStatus === 'READY_TO_HARVEST' || progress >= 100);

              // Format Takaran Pemanis
              const molassesDisplay =
                Number(batch.molassesKg) < 1
                  ? `${Math.round(Number(batch.molassesKg) * 1000)} gr`
                  : `${Number(batch.molassesKg)} kg`;

              const wasteDisplay =
                Number(batch.organicWasteKg) < 1
                  ? `${Math.round(Number(batch.organicWasteKg) * 1000)} gr`
                  : `${Number(batch.organicWasteKg)} kg`;

              return (
                <div
                  key={batch.id}
                  className="bg-white rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 border border-stone-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group min-w-0"
                >
                  <div className="space-y-2.5 sm:space-y-4">
                    {/* Header: Kode Galon & Status */}
                    <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2">
                      <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                        <span className="font-mono text-[10px] sm:text-xs font-black px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-[#012D1D] text-white tracking-wider truncate">
                          {batch.batchCode || batch.publicCode}
                        </span>
                      </div>

                      {isFailed ? (
                        <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[11px] font-bold px-1.5 sm:px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                          <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" /> Gagal Fermentasi
                        </span>
                      ) : isHarvested ? (
                        <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[11px] font-bold px-1.5 sm:px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                          <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" /> Dipanen
                        </span>
                      ) : isReady ? (
                        <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[11px] font-bold px-1.5 sm:px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                          <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" /> Siap Panen
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[11px] font-bold px-1.5 sm:px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" /> Hari ke-{dayPassed}/90
                        </span>
                      )}
                    </div>

                    {/* Nama Wadah & Badge Jenis Enzim */}
                    <div>
                      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-1">
                        <span
                          className={`inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border whitespace-nowrap ${
                            isClassic
                              ? 'bg-orange-50 text-orange-800 border-orange-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {isClassic ? (
                            <Sparkles className="w-2.5 h-2.5 text-orange-600 shrink-0" />
                          ) : (
                            <Leaf className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                          )}
                          {enzymeMeta.label}
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-base font-bold text-stone-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
                        {batch.containerName}
                      </h3>
                      <p className="text-[9px] sm:text-[11px] text-stone-400 font-mono mt-0.5 truncate">
                        ID: {batch.publicCode}
                      </p>
                    </div>

                    {/* Linimasa: Buat & Panen */}
                    <div className="bg-[#FAFBF9] rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-stone-200/80 space-y-1 sm:space-y-2 text-[10px] sm:text-xs">
                      <div className="flex flex-wrap justify-between items-center gap-x-1 text-stone-600">
                        <span className="text-[9px] sm:text-[11px] text-stone-400 flex items-center gap-1">
                          <Calendar className="hidden sm:block w-3 h-3 shrink-0" />
                          <span className="sm:hidden">Buat:</span>
                          <span className="hidden sm:inline">Tanggal Buat:</span>
                        </span>
                        <span className="font-bold text-stone-800">
                          {new Date(batch.startDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            timeZone: 'Asia/Jakarta',
                          })}
                        </span>
                      </div>

                      <div className="flex flex-wrap justify-between items-center gap-x-1 text-stone-600">
                        <span className="text-[9px] sm:text-[11px] text-stone-400 flex items-center gap-1">
                          <Clock className="hidden sm:block w-3 h-3 shrink-0" />
                          <span className="sm:hidden">Panen:</span>
                          <span className="hidden sm:inline">Tanggal Panen:</span>
                        </span>
                        <span className="font-bold text-emerald-900">
                          {new Date(batch.harvestEstimate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            timeZone: 'Asia/Jakarta',
                          })}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="pt-0.5 sm:pt-1">
                        <div className="w-full bg-stone-200 h-1.5 sm:h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isFailed
                                ? 'bg-rose-600'
                                : isHarvested
                                ? 'bg-blue-600'
                                : isReady
                                ? 'bg-emerald-600'
                                : 'bg-[#FC9634]'
                            }`}
                            style={{ width: `${isHarvested ? 100 : progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between gap-1 text-[9px] sm:text-[10px] text-stone-500 pt-1 font-medium">
                          <span>
                            {isFailed ? (
                              <span className="text-rose-700 font-bold">Dihentikan</span>
                            ) : (
                              <>
                                {isHarvested ? 100 : progress}%<span className="hidden sm:inline"> Selesai</span>
                              </>
                            )}
                          </span>
                          <span className={`truncate ${isFailed ? 'text-rose-700 font-semibold' : ''}`}>
                            {isFailed
                              ? 'Gagal Fermentasi'
                              : isHarvested
                              ? 'Tuntas'
                              : isReady
                              ? 'Siap Panen!'
                              : `Sisa ${daysLeft} hari`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Komposisi Bahan (Persis Catatan Kertas) */}
                    <div className="space-y-1.5 sm:space-y-2 pt-0.5 sm:pt-1">
                      <div className="text-[10px] sm:text-[11px] font-bold text-stone-700 flex items-center justify-between gap-1">
                        <span className="truncate">
                          Komposisi<span className="hidden sm:inline"> Bahan</span> :
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-stone-400 font-normal shrink-0">1 : 3 : 10</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1 sm:gap-2 text-[10px] sm:text-[11px]">
                        <div className="bg-sky-50/70 border border-sky-100 rounded-lg sm:rounded-xl px-1.5 py-1 sm:px-2.5 sm:py-1.5 text-sky-950 flex items-center gap-1.5 min-w-0">
                          <Droplet className="hidden sm:block w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                          <span className="leading-tight">
                            Air: <strong className="whitespace-nowrap">{Number(batch.waterLiter)} L</strong>
                          </span>
                        </div>

                        <div className="bg-amber-50/70 border border-amber-100 rounded-lg sm:rounded-xl px-1.5 py-1 sm:px-2.5 sm:py-1.5 text-amber-950 flex items-center gap-1.5 min-w-0">
                          <Scale className="hidden sm:block w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          <span className="leading-tight truncate">
                            {sweetenerMeta.label}: <strong className="whitespace-nowrap">{molassesDisplay}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Kulit Buah / Bahan Organik / Buah Segar Tags */}
                      <div className="bg-stone-50 border border-stone-200/80 rounded-xl sm:rounded-2xl p-2 sm:p-2.5 space-y-1 sm:space-y-1.5">
                        <span className="text-[9px] sm:text-[10px] font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1">
                          <Apple className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-700 shrink-0" />
                          {enzymeMeta.materialShortLabel} ({wasteDisplay}):
                        </span>
                        <div className="columns-1 sm:columns-2 gap-1.5 space-y-1">
                          {fruits.slice(0, 6).map((item, idx) => (
                            <div
                              key={idx}
                              className={`${
                                idx >= 3 ? 'hidden sm:flex' : 'flex'
                              } break-inside-avoid items-center gap-1 text-[9px] sm:text-[10px] font-semibold bg-white px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg border border-stone-200 text-stone-800 w-full truncate`}
                            >
                              <span className="font-bold text-[#2C5F2D] shrink-0">{idx + 1}.</span>
                              <span className="truncate">{item}</span>
                            </div>
                          ))}
                        </div>
                        {fruits.length > 3 && (
                          <span className="sm:hidden inline-block text-[9px] font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 text-emerald-800">
                            +{fruits.length - 3} jenis lainnya
                          </span>
                        )}
                        {fruits.length > 6 && (
                          <span className="hidden sm:inline-block text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-emerald-800">
                            +{fruits.length - 6} jenis lainnya
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2 pt-2.5 sm:pt-5 border-t border-stone-100 mt-2 sm:mt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedBatchForLabel(batch)}
                      className="inline-flex items-center justify-center gap-1 sm:gap-1.5 py-1.5 sm:py-2.5 px-1.5 sm:px-3 rounded-lg sm:rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-[10px] sm:text-xs transition-colors whitespace-nowrap"
                    >
                      <QrCode className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-600 shrink-0" />
                      Label QR
                    </button>

                    <Link
                      href={buildBatchPath(batch.publicCode)}
                      className="inline-flex items-center justify-center gap-1 py-1.5 sm:py-2.5 px-1.5 sm:px-3 rounded-lg sm:rounded-xl bg-[#012D1D] hover:bg-[#0B4A31] text-white font-bold text-[10px] sm:text-xs shadow-xs transition-colors whitespace-nowrap"
                    >
                      <span>Detail</span>
                      <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ════════════════ DIGITAL GALLON LABEL MODAL ════════════════ */}
      <EcoEnzymeQrModal
        isOpen={!!selectedBatchForLabel}
        onClose={() => setSelectedBatchForLabel(null)}
        batch={selectedBatchForLabel}
        isPublicView={true}
      />

      {/* ════════════════ VIDEO MODAL POPUP ════════════════ */}
      {activeEducationVideo && (() => {
        const isModalLocal = isLocalVideoSource(
          activeEducationVideo.src,
          activeEducationVideo.platform
        );
        const modalYoutubeId = !isModalLocal
          ? extractYouTubeId(activeEducationVideo.src)
          : null;
        const isModalWide = activeEducationVideo.aspect === 'wide';

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={activeEducationVideo.title}
            onClick={(e) => {
              if (e.target === e.currentTarget) setActiveEducationVideo(null);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md transition-opacity duration-200"
          >
            <div
              className={`bg-stone-900 rounded-2xl sm:rounded-3xl w-full p-3.5 sm:p-5 shadow-2xl border border-stone-700 relative text-white space-y-2.5 sm:space-y-3 animate-pop ${
                isModalWide ? 'max-w-3xl' : 'max-w-lg'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                <div className="min-w-0 pr-2">
                  <span className="text-[10px] uppercase font-bold text-[#FC9634] block">
                    {activeEducationVideo.category}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white truncate">
                    {activeEducationVideo.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveEducationVideo(null)}
                  aria-label="Tutup pemutar video"
                  className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div
                className={
                  isModalWide
                    ? 'relative aspect-video w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center'
                    : 'relative aspect-[9/14] sm:aspect-[9/13] max-h-[70vh] w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center'
                }
              >
                {isModalLocal ? (
                  <video
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                    src={activeEducationVideo.src}
                  >
                    Browser Anda tidak mendukung pemutar video HTML5.
                  </video>
                ) : modalYoutubeId ? (
                  <iframe
                    className="w-full h-full rounded-2xl"
                    src={`https://www.youtube.com/embed/${modalYoutubeId}?autoplay=1&rel=0`}
                    title={activeEducationVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <p className="text-sm text-stone-300">
                      Video eksternal di {activeEducationVideo.platform || 'situs web'}
                    </p>
                    {isSafeExternalVideoUrl(activeEducationVideo.src) && (
                      <a
                        href={activeEducationVideo.src}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FC9634] text-[#012D1D] font-bold text-xs hover:bg-[#e8801a] transition-all"
                      >
                        Buka Video di Tab Baru <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {activeEducationVideo.description && (
                <p className="text-xs text-stone-300 leading-relaxed pt-1">
                  {activeEducationVideo.description}
                </p>
              )}
            </div>
          </div>
        );
      })()}

    </div>
  );
}
