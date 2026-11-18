'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FlaskConical,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Scale,
  Apple,
  ChevronDown,
  ChevronUp,
  Share2,
  ArrowLeft,
  ArrowRight,
  Activity,
  MessageCircle,
  ExternalLink,
  BookOpen,
  ShoppingBag,
  Archive,
} from 'lucide-react';
import { EcoEnzymeBatch } from '@/types';
import { toast } from 'sonner';
import { OutlineLeaf, ConcentricCircles } from '@/components/ui/DecorativeElements';
import {
  getDayPassed,
  getDaysRemaining,
  getFermentationProgress,
  parseOrganicWasteTypes,
} from '@/lib/eco-enzyme';
import { buildBatchPath, buildBatchUrl, isTemporaryBaseUrl } from '@/lib/batch-url';
import { getSiteUrl } from '@/lib/api-config';

const COMMUNITY_WHATSAPP = '6281234567890';

type NextBatchRef = NonNullable<EcoEnzymeBatch['nextBatch']> & {
  batchCode?: string | null;
};

interface BatchDetailClientProps {
  batch: EcoEnzymeBatch;
}

export function BatchDetailClient({ batch }: BatchDetailClientProps) {
  const [showAllIngredients, setShowAllIngredients] = useState(false);
  const [copied, setCopied] = useState(false);

  const ingredients = React.useMemo(
    () => parseOrganicWasteTypes(batch.organicWasteTypes),
    [batch.organicWasteTypes]
  );

  const displayedIngredients = showAllIngredients
    ? ingredients
    : ingredients.slice(0, 8);

  const displayStatus = batch.displayStatus || batch.status;

  let progress =
    batch.progressPercent ??
    getFermentationProgress(batch.startDate, batch.harvestEstimate);
  if (batch.status === 'HARVESTED' || displayStatus === 'ARCHIVED') {
    progress = 100;
  }

  const daysRemaining = getDaysRemaining(batch.harvestEstimate);
  const dayPassed = batch.dayPassed || getDayPassed(batch.startDate);

  // Penanda waktu pembaruan terakhir (audit spesifikasi 3)
  const lastUpdatedDate = React.useMemo(() => {
    const timestamps: number[] = [];
    if (batch.updatedAt) timestamps.push(new Date(batch.updatedAt).getTime());
    if (batch.startDate) timestamps.push(new Date(batch.startDate).getTime());
    if (batch.inspectionLogs) {
      batch.inspectionLogs.forEach((l) => {
        if (l.logDate) timestamps.push(new Date(l.logDate).getTime());
      });
    }
    return timestamps.length > 0 ? new Date(Math.max(...timestamps)) : new Date();
  }, [batch]);

  const nextBatch = batch.nextBatch as NextBatchRef | null | undefined;
  const nextBatchTargetCode = nextBatch?.batchCode || nextBatch?.publicCode || '';

  const handleShare = async () => {
    const publicBaseUrl =
      typeof window !== 'undefined' && !isTemporaryBaseUrl(window.location.origin)
        ? window.location.origin
        : getSiteUrl();
    const url = buildBatchUrl(batch.publicCode, {
      short: true,
      baseUrl: publicBaseUrl,
    });
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Batch Eco Enzyme ${batch.publicCode} - Teman Pilah`,
          text: `Cek detail fermentasi Eco Enzyme (${batch.containerName}) di Teman Pilah!`,
          url,
        });
      } catch {
        // User cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast.success('Tautan berhasil disalin ke clipboard!');
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast.error('Gagal menyalin tautan');
      }
    }
  };

  // Human readable residue usage
  const residueMap: Record<string, string> = {
    KOMPOS_PADAT: 'Kompos Padat Organik',
    PUPUK_ORGANIK: 'Pupuk Hayati / Pupuk Cair',
    STARTER_BATCH_BARU: 'Biang / Starter Fermentasi Baru',
    PENGHARUM_TOILET: 'Pengharum & Pengurai Bau Toilet',
  };

  return (
    <div className="min-h-screen bg-[#F8F6F1] pt-16 md:pt-20 pb-12 sm:pb-20 px-3 sm:px-6 relative overflow-hidden">
      {/* Decorative Brand Accents (Figma Frame 48) */}
      <div className="absolute -right-24 top-28 opacity-20 pointer-events-none rotate-[20deg]">
        <OutlineLeaf size={340} color="#203220" strokeWidth={6.72} />
      </div>
      <div className="absolute -left-20 bottom-32 opacity-25 pointer-events-none">
        <ConcentricCircles size={300} color="#FC9634" />
      </div>
      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 relative z-10">
        
        {/* TOP BAR / BACK NAVIGATION */}
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/eco-enzyme"
            className="inline-flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-[#2C5F2D] hover:text-[#1A2F1D] bg-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-[#DCE3D6] shadow-sm transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Kembali ke Hub Eco Enzyme</span>
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-stone-700 hover:text-stone-900 bg-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border border-stone-200 shadow-sm hover:shadow transition-all shrink-0"
            type="button"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-800" />
            {copied ? 'Tersalin!' : 'Bagikan'}
          </button>
        </div>

        {/* SUKSESI GALON / BATCH BARU DETECTED (Spesifikasi 6) */}
        {nextBatch && (
          <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-3 sm:p-5 shadow-sm text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-emerald-100 text-emerald-800 flex-shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 block">
                  Pemberitahuan Wadah
                </span>
                <p className="font-extrabold text-xs sm:text-sm text-emerald-950 mt-0.5">
                  Galon ini sudah digunakan untuk batch baru
                </p>
                <p className="text-[11px] text-emerald-800 mt-0.5 sm:mt-1 leading-relaxed">
                  Wadah <strong>{batch.containerName}</strong> telah dipakai ulang untuk batch penerus{' '}
                  <span className="font-mono font-bold bg-white/70 px-1.5 py-0.5 rounded border border-emerald-200">
                    {nextBatchTargetCode}
                  </span>.
                </p>
              </div>
            </div>
            <Link
              href={buildBatchPath(nextBatchTargetCode)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-[#2C5F2D] hover:bg-[#234d24] text-white font-bold rounded-xl text-xs transition-colors flex-shrink-0 shadow-sm"
            >
              <span>Buka Batch Terbaru</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>
        )}

        {/* BANNER BATCH DIARSIPKAN (Spesifikasi 2 & 3) */}
        {displayStatus === 'ARCHIVED' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 sm:p-5 shadow-sm flex items-start gap-2.5 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-amber-100 text-amber-800 flex-shrink-0">
              <Archive className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
            </div>
            <div className="space-y-0.5 sm:space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 block">
                Status Arsip Permanen
              </span>
              <h3 className="font-bold text-xs sm:text-sm text-amber-950">
                Batch ini sudah selesai / diarsipkan
              </h3>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                QR Code pada galon ini tetap valid dan dapat dipindai kapan saja. Seluruh formulasi bahan, tanggal, dan riwayat inspeksi tetap tersimpan sebagai arsip resmi komunitas Teman Pilah.
              </p>
            </div>
          </div>
        )}

        {/* HERO / STATUS CARD */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-[#E3E8DC] shadow-md relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-28 h-28 sm:w-36 sm:h-36 bg-[#EAF3E8] rounded-bl-full -z-0 opacity-60 pointer-events-none" />

          <div className="relative z-10 space-y-3 sm:space-y-4">
            {/* BADGES ROW */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-mono text-[11px] sm:text-xs font-black px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl bg-[#012D1D] text-white tracking-wide">
                KODE: {batch.batchCode || batch.publicCode}
              </span>
              {batch.batchCode && batch.publicCode && batch.batchCode !== batch.publicCode && (
                <span className="font-mono text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-stone-100 text-stone-600 border border-stone-200">
                  {batch.publicCode}
                </span>
              )}

              {/* DYNAMIC STATUS BADGE */}
              {displayStatus === 'ARCHIVED' && (
                <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-stone-100 text-stone-800 border border-stone-300">
                  <Archive className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-600" /> Diarsipkan
                </span>
              )}
              {displayStatus === 'FERMENTING' && (
                <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600" /> Masa Fermentasi
                </span>
              )}
              {displayStatus === 'READY_TO_HARVEST' && (
                <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" /> Siap Dipanen
                </span>
              )}
              {displayStatus === 'HARVESTED' && (
                <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600" /> Selesai Dipanen
                </span>
              )}
              {displayStatus === 'FAILED' && (
                <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                  <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-600" /> Gagal Fermentasi
                </span>
              )}
            </div>

            {/* CONTAINER TITLE & UPDATED TIME */}
            <div>
              <h1 className="text-xl sm:text-3xl font-black text-[#1A2F1D] leading-tight">
                {batch.containerName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 mt-1 sm:mt-1.5 text-[11px] sm:text-xs text-[#586154]">
                <span className="flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#2C5F2D] shrink-0" />
                  Galon fermentasi Eco Enzyme Teman Pilah
                </span>
                <span className="hidden sm:inline text-stone-300">•</span>
                <span className="flex items-center gap-1 text-[10px] sm:text-[11px] text-stone-500">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-stone-400 shrink-0" />
                  Data diperbarui:{' '}
                  <strong className="text-stone-700">
                    {new Date(lastUpdatedDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'Asia/Jakarta',
                    })}
                  </strong>
                </span>
              </div>
            </div>

            {/* 90-DAY PROGRESS SECTION */}
            <div className="bg-[#FAFBF9] p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[#EDF2E8] space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                <span className="text-[#3D4F41]">
                  {displayStatus === 'HARVESTED'
                    ? 'Status Panen'
                    : displayStatus === 'ARCHIVED'
                    ? 'Status Siklus'
                    : 'Progres Fermentasi 90 Hari'}
                </span>
                <span className="text-[#2C5F2D] text-sm sm:text-base">{progress}%</span>
              </div>

              {/* PROGRESS BAR */}
              <div className="w-full bg-[#E5ECE0] h-2.5 sm:h-3 rounded-full overflow-hidden shadow-inner">
                <div
                  style={{ width: `${progress}%` }}
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    displayStatus === 'FAILED'
                      ? 'bg-rose-600'
                      : displayStatus === 'HARVESTED'
                      ? 'bg-blue-600'
                      : displayStatus === 'ARCHIVED'
                      ? 'bg-stone-500'
                      : 'bg-[#2C5F2D]'
                  }`}
                />
              </div>

              {/* TIMELINE METRICS */}
              <div className="flex items-center justify-between text-[11px] sm:text-xs text-[#6C7665] pt-0.5 sm:pt-1">
                {displayStatus === 'FERMENTING' ? (
                  <>
                    <span>
                      Hari ke-<strong>{dayPassed}</strong> dari 90
                    </span>
                    <span className="text-emerald-900 font-semibold">
                      Sisa: <strong>{daysRemaining} hari lagi</strong>
                    </span>
                  </>
                ) : displayStatus === 'READY_TO_HARVEST' ? (
                  <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    Wadah telah genap 90 hari dan siap disaring!
                  </span>
                ) : displayStatus === 'HARVESTED' ? (
                  <span className="text-blue-800 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    Tuntas dipanen pada {new Date(batch.actualHarvestDate || batch.harvestEstimate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })}
                  </span>
                ) : displayStatus === 'ARCHIVED' ? (
                  <span className="text-stone-700 font-medium flex items-center gap-1.5">
                    <Archive className="w-4 h-4 text-stone-500 shrink-0" />
                    Siklus fermentasi batch ini telah diarsipkan secara permanen.
                  </span>
                ) : (
                  <span className="text-rose-700 font-bold">
                    Proses dihentikan karena kontaminasi atau kerusakan wadah
                  </span>
                )}
              </div>
            </div>

            {/* HARVEST CARD (IF HARVESTED) */}
            {batch.harvestLiter && (
              <div className="bg-gradient-to-br from-blue-50 to-emerald-50 p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-blue-200 space-y-2">
                <div className="flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-blue-900">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-700" />
                  Hasil Panen
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                  <div className="bg-white/80 p-2.5 sm:p-3 rounded-xl border border-blue-100">
                    <span className="text-[10px] sm:text-[11px] text-stone-500 block">Cairan Panen Bersih</span>
                    <span className="text-base sm:text-xl font-black text-blue-800">
                      {Number(batch.harvestLiter).toLocaleString('id-ID')} Liter
                    </span>
                  </div>
                  {batch.residueUsage && (
                    <div className="bg-white/80 p-2.5 sm:p-3 rounded-xl border border-blue-100">
                      <span className="text-[10px] sm:text-[11px] text-stone-500 block">Pemanfaatan Ampas</span>
                      <span className="text-xs sm:text-sm font-black text-emerald-800 leading-snug block">
                        {residueMap[batch.residueUsage] || batch.residueUsage}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SUMMARY TIMELINE & COMPOSITION */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
          {/* TANGGAL */}
          <div className="bg-white p-3 sm:p-5 rounded-2xl border border-[#E3E8DC] shadow-sm space-y-2 sm:space-y-3 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold text-[#2C5F2D] uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">
                Linimasa<span className="hidden sm:inline"> Waktu</span>
              </span>
            </div>
            <div className="space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 sm:py-1.5 border-b border-stone-100 gap-0.5">
                <span className="text-[10px] sm:text-xs text-stone-500">Tanggal Buat:</span>
                <span className="font-bold text-stone-800">
                  {new Date(batch.startDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'Asia/Jakarta',
                  })}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 sm:py-1.5 gap-0.5">
                <span className="text-[10px] sm:text-xs text-stone-500">
                  {batch.actualHarvestDate ? 'Tanggal Selesai Panen:' : 'Tanggal Panen:'}
                </span>
                <span className="font-bold text-emerald-900">
                  {new Date(batch.actualHarvestDate || batch.harvestEstimate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    timeZone: 'Asia/Jakarta',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* FORMULA RASIO 1:3:10 */}
          <div className="bg-white p-3 sm:p-5 rounded-2xl border border-[#E3E8DC] shadow-sm space-y-2 sm:space-y-3 min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold text-[#2C5F2D] uppercase tracking-wider">
              <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">
                <span className="sm:hidden">Rasio 1:3:10</span>
                <span className="hidden sm:inline">Komposisi Bahan (1:3:10)</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 text-xs">
              <div className="bg-amber-50/70 px-2 py-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border border-amber-200 flex sm:flex-col items-center justify-between sm:justify-center sm:text-center gap-1">
                <span className="text-[10px] text-amber-800 font-semibold">Pemanis / Gula</span>
                <span className="text-xs sm:text-base font-black text-amber-900 whitespace-nowrap">
                  {Number(batch.molassesKg) < 1
                    ? `${Math.round(Number(batch.molassesKg) * 1000)} gr`
                    : `${Number(batch.molassesKg)} kg`}
                </span>
              </div>
              <div className="bg-emerald-50/70 px-2 py-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border border-emerald-200 flex sm:flex-col items-center justify-between sm:justify-center sm:text-center gap-1">
                <span className="text-[10px] text-emerald-800 font-semibold">Sampah BO</span>
                <span className="text-xs sm:text-base font-black text-emerald-900 whitespace-nowrap">
                  {Number(batch.organicWasteKg) < 1
                    ? `${Math.round(Number(batch.organicWasteKg) * 1000)} gr`
                    : `${Number(batch.organicWasteKg)} kg`}
                </span>
              </div>
              <div className="bg-sky-50/70 px-2 py-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border border-sky-200 flex sm:flex-col items-center justify-between sm:justify-center sm:text-center gap-1">
                <span className="text-[10px] text-sky-800 font-semibold">Air Bersih</span>
                <span className="text-xs sm:text-base font-black text-sky-900 whitespace-nowrap">
                  {Number(batch.waterLiter)} <span className="text-[10px] font-normal">L</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ORGANIC INGREDIENTS LIST */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E3E8DC] shadow-sm space-y-3 sm:space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-[#2C5F2D] uppercase tracking-wider">
              <Apple className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Variasi Bahan Organik ({ingredients.length} Jenis)
            </div>
            <span className="text-[10px] sm:text-[11px] text-stone-500 font-medium">Bahan Kulit Buah Segar</span>
          </div>

          <p className="text-[11px] sm:text-xs text-[#586154] leading-relaxed">
            Kombinasi aneka kulit buah manis dan asam segar memperkaya variasi enzim proteolitik, amilase, dan aroma harum alami.
          </p>

          {/* CHIP LIST */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-0.5 sm:pt-1">
            {displayedIngredients.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold bg-[#F0F5EE] text-[#1E3B20] border border-[#D5E3D2]"
              >
                <span className="text-[10px] sm:text-[11px]">🍃</span>
                {item}
              </span>
            ))}
          </div>

          {/* EXPAND/COLLAPSE IF > 8 INGREDIENTS */}
          {ingredients.length > 8 && (
            <button
              onClick={() => setShowAllIngredients(!showAllIngredients)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2C5F2D] hover:text-[#1A2F1D] pt-1 sm:pt-2 transition-colors"
              type="button"
            >
              {showAllIngredients ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Tampilkan Lebih Sedikit
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Lihat Semua ({ingredients.length} Jenis Kulit Buah)
                </>
              )}
            </button>
          )}
        </div>

        {/* INSPECTION LOGS (QC TIMELINE) */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#E3E8DC] shadow-sm space-y-3.5 sm:space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-[#2C5F2D] uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> Riwayat Inspeksi & Kontrol Kualitas
            </div>
            <span className="text-[10px] sm:text-[11px] font-mono text-stone-500 shrink-0">
              {batch.inspectionLogs?.length || 0} Catatan
            </span>
          </div>

          {!batch.inspectionLogs || batch.inspectionLogs.length === 0 ? (
            <div className="text-center py-6 sm:py-8 px-3 bg-[#FAFBF9] rounded-xl sm:rounded-2xl border border-dashed border-stone-200">
              <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-stone-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-stone-700">Belum ada catatan inspeksi berkala</p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Pemeriksaan aroma, pH, dan lapisan jamur akan dicatat oleh relawan pengawas.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-[#DCE3D6] ml-2 sm:ml-3 pl-3.5 sm:pl-5 space-y-3.5 sm:space-y-6">
              {batch.inspectionLogs.map((log, index) => (
                <div key={`${log.dayNumber}-${log.logDate}-${index}`} className="relative group">
                  {/* Timeline bullet dot */}
                  <div className="absolute -left-[21px] sm:-left-[27px] top-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#2C5F2D] border-2 border-white shadow-sm" />

                  <div className="bg-[#FAFBF9] p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#EDF2E8] space-y-1.5 sm:space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-[#1A2F1D] bg-[#EAF2E8] px-2 sm:px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px]">
                        Hari ke-{log.dayNumber}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-stone-500">
                        {new Date(log.logDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          timeZone: 'Asia/Jakarta',
                        })}
                      </span>
                    </div>

                    {/* METRICS ROW */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-xs pt-0.5 sm:pt-1">
                      {log.phLevel && (
                        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-stone-700">
                          <span className="text-stone-400">Keasaman:</span>
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded border border-emerald-200">
                            pH {Number(log.phLevel).toFixed(1)}
                          </span>
                        </div>
                      )}
                      {log.aromaStatus && (
                        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 text-stone-700">
                          <span className="text-stone-400">Aroma:</span>
                          <span className="font-semibold text-stone-800">{log.aromaStatus}</span>
                        </div>
                      )}
                    </div>

                    {log.fungusColor && (
                      <div className="text-[11px] sm:text-xs text-stone-700">
                        <span className="text-stone-400">Kondisi Jamur:</span>{' '}
                        <span className="font-medium text-stone-800">{log.fungusColor}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CALL TO ACTION BUTTONS */}
        <div className="bg-gradient-to-br from-[#1E3B20] to-[#122814] rounded-2xl sm:rounded-3xl p-4 sm:p-8 text-white space-y-3.5 sm:space-y-5 shadow-lg">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#98C299]">
              Gerakan Peduli Lingkungan Teman Pilah
            </span>
            <h3 className="text-lg sm:text-2xl font-black mt-1">
              Ingin Membuat Eco Enzyme Sendiri?
            </h3>
            <p className="text-xs sm:text-sm text-white/80 mt-1 leading-relaxed">
              Mulai dari dapur Anda! Cukup pilah sampah kulit buah dan ikuti kalkulator perbandingan 1 : 3 : 10 gratis kami.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-0.5 sm:pt-1">
            <Link
              href="/eco-enzyme#kalkulator"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-[#2C5F2D] hover:bg-[#387639] text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              Pelajari cara membuat Eco Enzyme
            </Link>

            <Link
              href="/#katalog"
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all"
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              Lihat produk
            </Link>
          </div>

          <div className="pt-2 border-t border-white/10 flex justify-center">
            <a
              href={`https://wa.me/${COMMUNITY_WHATSAPP}?text=${encodeURIComponent(
                `Halo komunitas Teman Pilah, saya memindai QR Code batch ${batch.publicCode} (${batch.containerName}) dan ingin bertanya tentang program Eco Enzyme.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-300 hover:text-emerald-200 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Tanya Relawan via WhatsApp
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
