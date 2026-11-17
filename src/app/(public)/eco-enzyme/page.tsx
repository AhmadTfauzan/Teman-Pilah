'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
} from 'lucide-react';
import { EcoEnzymeQrModal } from '@/components/admin/EcoEnzymeQrModal';
import { ecoEnzymeApi } from '@/lib/api/eco-enzyme';
import { ecoEnzymeVideoApi, getEcoEnzymeVideoThumbnailUrl } from '@/lib/api/eco-enzyme-video';
import { EcoEnzymeBatch, EcoEnzymeVideoItem } from '@/types';
import {
  getDaysRemaining,
  getFermentationProgress,
  getDayPassed,
  parseOrganicWasteTypes,
} from '@/lib/eco-enzyme';
import { buildBatchPath, buildBatchUrl } from '@/lib/batch-url';
import { OutlineLeaf, ConcentricCircles } from '@/components/ui/DecorativeElements';

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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FERMENTING' | 'READY' | 'HARVESTED'>('ALL');
  const [selectedBatchForLabel, setSelectedBatchForLabel] = useState<EcoEnzymeBatch | null>(null);
  const [educationVideos, setEducationVideos] = useState<EcoEnzymeVideoItem[]>(DEFAULT_EDUCATION_VIDEOS);
  const [activeEducationVideo, setActiveEducationVideo] = useState<{
    title: string;
    category: string;
    src: string;
    duration: string;
    description: string;
    platform?: string;
  } | null>(null);

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

  // Filter galon berdasarkan pencarian dan status
  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const code = (b.batchCode || '').toLowerCase();
      const pub = (b.publicCode || '').toLowerCase();
      const name = (b.containerName || '').toLowerCase();
      const fruits = (b.organicWasteTypes || '').toLowerCase();

      const matchSearch =
        !q ||
        code.includes(q) ||
        pub.includes(q) ||
        name.includes(q) ||
        fruits.includes(q);

      if (!matchSearch) return false;

      const isReady =
        b.displayStatus === 'READY_TO_HARVEST' ||
        getFermentationProgress(b.startDate, b.harvestEstimate) >= 100;
      const isHarvested = b.status === 'HARVESTED';
      const isFermenting = !isHarvested && !isReady;

      if (statusFilter === 'FERMENTING') return isFermenting;
      if (statusFilter === 'READY') return isReady && !isHarvested;
      if (statusFilter === 'HARVESTED') return isHarvested;

      return true;
    });
  }, [batches, searchQuery, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    // Cek apakah ada kecocokan persis pada kode galon
    const exactMatch = batches.find(
      (b) =>
        b.batchCode?.toLowerCase() === q.toLowerCase() ||
        b.publicCode?.toLowerCase() === q.toLowerCase() ||
        b.containerName?.toLowerCase() === q.toLowerCase()
    );

    if (exactMatch) {
      router.push(buildBatchPath(exactMatch.publicCode));
    } else {
      // Jika tidak langsung redirect, arahkan ke pencarian detail
      router.push(`/eco-enzyme/batch/${encodeURIComponent(q)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-900">
      
      {/* ════════════════ HERO SECTION ════════════════ */}
      <section className="relative overflow-hidden bg-[#012D1D] text-white pt-28 pb-16 md:pt-36 md:pb-20 px-4 sm:px-6 lg:px-8">
        {/* Figma Frame 48 Brand Background Ornaments */}
        <div className="absolute -right-20 -top-16 opacity-15 pointer-events-none rotate-[20deg]">
          <OutlineLeaf size={380} color="#203220" strokeWidth={6.72} />
        </div>
        <div className="absolute -left-20 -bottom-24 opacity-20 pointer-events-none">
          <ConcentricCircles size={320} color="#FC9634" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold backdrop-blur-sm border border-white/10">
            <Leaf className="w-3.5 h-3.5" />
            Transparansi Fermentasi Komunitas Teman Pilah
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
            Pemantauan Fermentasi <span className="text-[#FC9634]">Eco Enzyme</span>
          </h1>

          <p className="text-sm sm:text-base text-stone-200/90 max-w-2xl mx-auto leading-relaxed">
            Pantau langsung bahan yang difermentasi, takaran air, madu/gula, dan komposisi kulit buah pada setiap galon.
            Pindai barcode pada fisik galon atau masukkan kodenya di bawah ini.
          </p>

          {/* LOOKUP SEARCH BAR */}
          <form
            onSubmit={handleSearchSubmit}
            className="pt-4 max-w-xl mx-auto flex flex-col sm:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Masukkan Kode Galon (contoh: GL-01, Galon 1, EE-2610)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-stone-900 pl-11 pr-4 py-3.5 rounded-2xl text-xs sm:text-sm font-medium shadow-lg placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#FC9634]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FC9634] hover:bg-[#e88523] text-stone-950 font-black rounded-2xl text-xs sm:text-sm shadow-lg transition-transform active:scale-95"
            >
              <QrCode className="w-4 h-4" />
              Cek Galon
            </button>
          </form>

          <p className="text-[11px] text-stone-300/80 pt-1 flex items-center justify-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
            Setiap galon fisik memiliki stiker QR Code yang bisa discan langsung dengan kamera ponsel.
          </p>
        </div>
      </section>

      {/* ════════════════ FORMULA 1:3:10 RINGKAS ════════════════ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
        <div className="bg-white rounded-3xl p-5 md:p-6 shadow-xl border border-stone-200/80 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#3B9734] block">
              Standar Rumus Alami
            </span>
            <h3 className="text-base sm:text-lg font-black text-stone-900">
              Formula Emas 1 : 3 : 10 (90 Hari)
            </h3>
            <p className="text-xs text-stone-500 max-w-sm leading-relaxed">
              Keseimbangan takaran fermentasi alami untuk menghasilkan enzim aktif berkualitas.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <div className="bg-[#FFF8F0] border border-[#FDE3C7] rounded-2xl p-3 text-center min-w-[90px]">
              <div className="text-base sm:text-lg font-black text-[#B45309]">1 Bagian</div>
              <div className="text-[11px] font-bold text-stone-800 mt-0.5">Pemanis</div>
              <div className="text-[10px] text-stone-500">Gula / Madu</div>
            </div>

            <div className="bg-[#F0F8EE] border border-[#CFE7CA] rounded-2xl p-3 text-center min-w-[90px]">
              <div className="text-base sm:text-lg font-black text-[#2C5F2D]">3 Bagian</div>
              <div className="text-[11px] font-bold text-stone-800 mt-0.5">Bahan BO</div>
              <div className="text-[10px] text-stone-500">Kulit Buah</div>
            </div>

            <div className="bg-[#F0F7FC] border border-[#CEE3F5] rounded-2xl p-3 text-center min-w-[90px]">
              <div className="text-base sm:text-lg font-black text-[#0369A1]">10 Bagian</div>
              <div className="text-[11px] font-bold text-stone-800 mt-0.5">Air Bersih</div>
              <div className="text-[10px] text-stone-500">Air Sumur/AC</div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ VIDEO EDUKASI ECO ENZYME ════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 md:pt-14 pb-2">
        <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-stone-200/90 shadow-sm relative overflow-hidden">
          {/* Subtle Decorative Background Leaf */}
          <div className="absolute -right-20 -bottom-20 opacity-10 pointer-events-none rotate-12">
            <OutlineLeaf size={280} color="#203220" strokeWidth={6.72} />
          </div>

          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 md:pb-8 border-b border-stone-100 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
                <Film className="w-3.5 h-3.5 text-emerald-600" />
                Video Edukasi Komunitas
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                Video Edukasi <span className="text-[#2C5F2D]">Eco Enzyme</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-xl leading-relaxed">
                Tonton panduan visual mengenai manfaat luar biasa serta tata cara pembuatan Eco Enzyme alami menggunakan limbah organik dapur Anda.
              </p>
            </div>
            <div className="text-[11px] font-semibold text-stone-500 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 flex items-center gap-2 self-start md:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {educationVideos.length} Video Panduan Tersedia
            </div>
          </div>

          {/* Dynamic Video Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pt-6 md:pt-8 relative z-10">
            {educationVideos.map((video, idx) => {
              const isLocal =
                video.platform === 'Local' ||
                video.videoUrl.startsWith('/') ||
                video.videoUrl.endsWith('.mp4') ||
                video.videoUrl.endsWith('.webm');

              return (
                <div
                  key={video.id || idx}
                  className="bg-[#FAFBF9] rounded-3xl p-4 sm:p-5 border border-stone-200/90 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Video Player Frame */}
                    <div className="relative aspect-[9/13] max-h-[480px] w-full rounded-2xl overflow-hidden bg-stone-950 shadow-inner flex items-center justify-center">
                      {isLocal ? (
                        <video
                          controls
                          preload="metadata"
                          playsInline
                          className="w-full h-full object-contain bg-black rounded-2xl"
                          src={video.videoUrl}
                        >
                          Browser Anda tidak mendukung pemutar video HTML5.
                        </video>
                      ) : (
                        <div className="relative w-full h-full bg-stone-900 group/thumb">
                          {video.thumbnail ? (
                            <Image
                              src={getEcoEnzymeVideoThumbnailUrl(video.thumbnail)}
                              alt={video.title}
                              fill
                              unoptimized
                              className="object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-stone-800 text-stone-400">
                              <Film className="w-12 h-12 mb-2 text-stone-500" />
                              <span className="text-xs font-semibold">{video.platform || 'Video'}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 group-hover/thumb:bg-black/20 transition-colors flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveEducationVideo({
                                  title: video.title,
                                  category: video.category || 'Edukasi Eco Enzyme',
                                  src: video.videoUrl,
                                  duration: video.duration || '00:00',
                                  description: video.description || '',
                                  platform: video.platform,
                                })
                              }
                              className="h-14 w-14 rounded-full bg-[#FC9634] hover:bg-[#e8801a] hover:scale-110 flex items-center justify-center text-[#012D1D] shadow-xl transition-all"
                            >
                              <Play className="w-6 h-6 fill-[#012D1D] ml-0.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Badges Overlay */}
                      <div className="absolute top-3 left-3 pointer-events-none">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                          {idx % 2 === 0 ? (
                            <Sparkles className="w-3 h-3 text-[#FC9634]" />
                          ) : (
                            <Scale className="w-3 h-3 text-[#FC9634]" />
                          )}
                          {video.category || 'Eco Enzyme'}
                        </span>
                      </div>
                      {video.duration && (
                        <div className="absolute top-3 right-3 pointer-events-none">
                          <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-stone-200 font-mono text-[10px] font-bold">
                            {video.duration}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Video Meta & Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-800">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900">
                          {video.category || 'Panduan'}
                        </span>
                        {video.duration && (
                          <>
                            <span className="text-stone-300">•</span>
                            <span className="text-stone-500 font-normal">Durasi {video.duration}</span>
                          </>
                        )}
                        <span className="text-stone-300">•</span>
                        <span className="text-stone-400 font-normal">{video.platform}</span>
                      </div>

                      <h3 className="text-lg font-black text-stone-900 group-hover:text-emerald-800 transition-colors">
                        {video.title}
                      </h3>

                      <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                        {video.description}
                      </p>

                      {video.tags && video.tags.length > 0 && (
                        <div className="pt-1 flex flex-wrap gap-1.5 text-[10px]">
                          {video.tags.map((tag: string, tIdx: number) => (
                            <span
                              key={tIdx}
                              className="bg-white px-2.5 py-1 rounded-lg border border-stone-200 text-stone-700 font-medium"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-4 mt-3 border-t border-stone-200/60 flex items-center justify-between">
                    <span className="text-[11px] text-stone-400 font-medium">
                      Komunitas Teman Pilah
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveEducationVideo({
                          title: video.title,
                          category: video.category || 'Edukasi Eco Enzyme',
                          src: video.videoUrl,
                          duration: video.duration || '00:00',
                          description: video.description || '',
                          platform: video.platform,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Buka di Layar Penuh
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════ DAFTAR GALON KOMUNITAS ════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-6">
        
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Manajemen <span className="text-[#2C5F2D]">Eco Enzyme</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Daftar seluruh galon yang sedang aktif difermentasi maupun yang telah dipanen oleh warga.
            </p>
          </div>

          {/* Filter Status Tabs */}
          <div className="flex items-center gap-1.5 bg-stone-200/60 p-1 rounded-2xl self-start sm:self-center">
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'FERMENTING', label: 'Fermentasi' },
              { id: 'READY', label: 'Siap Panen' },
              { id: 'HARVESTED', label: 'Dipanen' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
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

        {/* LOADING STATE */}
        {loading && (
          <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-stone-600">Memuat data galon...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredBatches.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-stone-300 p-6 space-y-3">
            <AlertCircle className="w-10 h-10 text-stone-400 mx-auto" />
            <h3 className="text-sm font-bold text-stone-800">Tidak ada galon yang sesuai</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {searchQuery
                ? `Tidak ditemukan galon dengan kata kunci "${searchQuery}". Coba periksa kembali kode galon.`
                : 'Belum ada data galon fermentasi yang terdaftar.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-emerald-800 hover:underline"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        )}

        {/* GALLON CARDS GRID */}
        {!loading && filteredBatches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBatches.map((batch) => {
              const progress = getFermentationProgress(batch.startDate, batch.harvestEstimate);
              const dayPassed = getDayPassed(batch.startDate);
              const daysLeft = getDaysRemaining(batch.harvestEstimate);
              const fruits = parseOrganicWasteTypes(batch.organicWasteTypes);

              const isHarvested = batch.status === 'HARVESTED';
              const isReady =
                batch.displayStatus === 'READY_TO_HARVEST' || progress >= 100;
              const isFermenting = !isHarvested && !isReady;

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
                  className="bg-white rounded-3xl p-5 border border-stone-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Header: Kode Galon & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-[#012D1D] text-white tracking-wider">
                          {batch.batchCode || batch.publicCode}
                        </span>
                      </div>

                      {isHarvested ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          <CheckCircle2 className="w-3 h-3" /> Dipanen
                        </span>
                      ) : isReady ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Sparkles className="w-3 h-3" /> Siap Panen
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3 h-3" /> Hari ke-{dayPassed}/90
                        </span>
                      )}
                    </div>

                    {/* Nama Wadah */}
                    <div>
                      <h3 className="text-base font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">
                        {batch.containerName}
                      </h3>
                      <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                        ID: {batch.publicCode}
                      </p>
                    </div>

                    {/* Linimasa: Buat & Panen */}
                    <div className="bg-[#FAFBF9] rounded-2xl p-3 border border-stone-200/80 space-y-2 text-xs">
                      <div className="flex justify-between items-center text-stone-600">
                        <span className="text-[11px] text-stone-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Tanggal Buat:
                        </span>
                        <span className="font-bold text-stone-800">
                          {new Date(batch.startDate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-stone-600">
                        <span className="text-[11px] text-stone-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Tanggal Panen:
                        </span>
                        <span className="font-bold text-emerald-900">
                          {new Date(batch.harvestEstimate).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="pt-1">
                        <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isHarvested
                                ? 'bg-blue-600'
                                : isReady
                                ? 'bg-emerald-600'
                                : 'bg-[#FC9634]'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-stone-500 pt-1 font-medium">
                          <span>{progress}% Selesai</span>
                          <span>
                            {isHarvested
                              ? 'Tuntas'
                              : isReady
                              ? 'Siap Panen!'
                              : `Sisa ${daysLeft} hari`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Komposisi Bahan (Persis Catatan Kertas) */}
                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] font-bold text-stone-700 flex items-center justify-between">
                        <span>Komposisi Bahan :</span>
                        <span className="text-[10px] text-stone-400 font-normal">1 : 3 : 10</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-sky-50/70 border border-sky-100 rounded-xl px-2.5 py-1.5 text-sky-950 flex items-center gap-1.5">
                          <Droplet className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                          <span>Air: <strong>{Number(batch.waterLiter)} L</strong></span>
                        </div>

                        <div className="bg-amber-50/70 border border-amber-100 rounded-xl px-2.5 py-1.5 text-amber-950 flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                          <span>Pemanis: <strong>{molassesDisplay}</strong></span>
                        </div>
                      </div>

                      {/* Kulit Buah / BO Tags */}
                      <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-2.5 space-y-1.5">
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block flex items-center gap-1">
                          <Apple className="w-3 h-3 text-emerald-700" />
                          BO ({wasteDisplay}):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {fruits.map((item, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-semibold bg-white px-2 py-0.5 rounded-lg border border-stone-200 text-stone-800"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="grid grid-cols-2 gap-2 pt-5 border-t border-stone-100 mt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedBatchForLabel(batch)}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5 text-stone-600" />
                      Label QR
                    </button>

                    <Link
                      href={buildBatchPath(batch.publicCode)}
                      className="inline-flex items-center justify-center gap-1 py-2.5 px-3 rounded-xl bg-[#012D1D] hover:bg-[#0B4A31] text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      <span>Detail</span>
                      <ArrowRight className="w-3.5 h-3.5" />
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
      />

      {/* ════════════════ VIDEO MODAL POPUP ════════════════ */}
      {activeEducationVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-stone-900 rounded-3xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-stone-700 relative text-white space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#FC9634] block">
                  {activeEducationVideo.category}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {activeEducationVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveEducationVideo(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-[9/14] sm:aspect-[9/13] max-h-[70vh] w-full rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              {activeEducationVideo.src.startsWith('/') ||
              activeEducationVideo.src.endsWith('.mp4') ||
              activeEducationVideo.src.endsWith('.webm') ? (
                <video
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                  src={activeEducationVideo.src}
                >
                  Browser Anda tidak mendukung pemutar video HTML5.
                </video>
              ) : activeEducationVideo.src.includes('youtube.com') || activeEducationVideo.src.includes('youtu.be') ? (
                <iframe
                  className="w-full h-full rounded-2xl"
                  src={
                    activeEducationVideo.src.includes('embed')
                      ? activeEducationVideo.src
                      : `https://www.youtube.com/embed/${
                          activeEducationVideo.src.match(/(?:youtu\.be\/|v=)([^"&?\/\s]{11})/)?.[1] || ''
                        }?autoplay=1`
                  }
                  title={activeEducationVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <p className="text-sm text-stone-300">
                    Video eksternal di {activeEducationVideo.platform || 'situs web'}
                  </p>
                  <a
                    href={activeEducationVideo.src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FC9634] text-[#012D1D] font-bold text-xs hover:bg-[#e8801a] transition-all"
                  >
                    Buka Video di Tab Baru <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            <p className="text-xs text-stone-300 leading-relaxed pt-1">
              {activeEducationVideo.description}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
