'use client';

import React, { useState } from 'react';
import { X, QrCode, Lock, Sparkles, Beaker, Apple, Droplet, Scale, Leaf } from 'lucide-react';
import {
  EcoEnzymeBatch,
  EcoEnzymeBatchStatus,
  EnzymeFailureReason,
  EnzymeSweetenerType,
  EnzymeType,
} from '@/types';
import {
  addDaysToDateInput,
  formatDateInputWib,
  getAllowedSweetenersForEnzyme,
  getDefaultSweetenerForEnzyme,
  getEnzymeTypeMeta,
  getSweetenerMeta,
  getTodayWibDateInput,
  isSweetenerAllowedForEnzyme,
  normalizeEnzymeType,
  normalizeSweetenerForEnzyme,
} from '@/lib/eco-enzyme';
import { toast } from 'sonner';

export interface EcoEnzymeModalSubmitData {
  batchCode?: string;
  enzymeType: EnzymeType;
  sweetenerType: EnzymeSweetenerType;
  containerName: string;
  containerCapacityLiter: number;
  molassesKg: number;
  organicWasteKg: number;
  waterLiter: number;
  organicWasteTypes: string;
  startDate: string;
  harvestEstimate?: string;
  photoUrl?: string | null;
  notes?: string | null;
  status?: EcoEnzymeBatchStatus;
  failureReason?: EnzymeFailureReason | null;
  failureNotes?: string | null;
  previousBatchId?: string | null;
}

interface EcoEnzymeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EcoEnzymeModalSubmitData) => Promise<void>;
  initialData?: EcoEnzymeBatch | null;
  successorOfBatch?: EcoEnzymeBatch | null;
}

function isSafePhotoUrlInput(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function EcoEnzymeModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  successorOfBatch,
}: EcoEnzymeModalProps) {
  if (!isOpen) return null;

  const modalKey = initialData?.id
    ? `edit-${initialData.id}`
    : successorOfBatch?.id
    ? `successor-${successorOfBatch.id}`
    : 'new';

  return (
    <EcoEnzymeModalContent
      key={modalKey}
      onClose={onClose}
      onSubmit={onSubmit}
      initialData={initialData}
      successorOfBatch={successorOfBatch}
    />
  );
}

function EcoEnzymeModalContent({
  onClose,
  onSubmit,
  initialData,
  successorOfBatch,
}: Omit<EcoEnzymeModalProps, 'isOpen'>) {
  const todayWib = getTodayWibDateInput();
  const initialEnzymeType = normalizeEnzymeType(initialData?.enzymeType);
  const initialSweetenerType = normalizeSweetenerForEnzyme(
    initialData?.sweetenerType,
    initialEnzymeType
  );
  const initialMolassesKg = initialData ? Number(initialData.molassesKg) || 0.15 : 0.15;
  const initialWasteKg = initialData ? Number(initialData.organicWasteKg) || 0.45 : 0.45;
  const isHarvestedLocked = initialData?.status === 'HARVESTED';

  const [enzymeType, setEnzymeType] = useState<EnzymeType>(initialEnzymeType);
  const [sweetenerType, setSweetenerType] = useState<EnzymeSweetenerType>(initialSweetenerType);
  const [batchCode, setBatchCode] = useState(initialData?.batchCode || '');
  const [containerName, setContainerName] = useState(
    initialData?.containerName || successorOfBatch?.containerName || ''
  );
  const [containerCapacityLiter, setContainerCapacityLiter] = useState<number>(
    initialData
      ? Number(initialData.containerCapacityLiter) || 5
      : successorOfBatch
      ? Number(successorOfBatch.containerCapacityLiter) || 5
      : 5
  );

  // Satuan & Nilai Pemanis
  const [molassesUnit, setMolassesUnit] = useState<'gr' | 'kg'>(
    initialData && initialMolassesKg >= 1 ? 'kg' : 'gr'
  );
  const [molassesInput, setMolassesInput] = useState<number>(
    initialData
      ? initialMolassesKg < 1
        ? Math.round(initialMolassesKg * 1000)
        : initialMolassesKg
      : 150
  );

  // Satuan & Nilai Bahan Organik / Buah Segar
  const [wasteUnit, setWasteUnit] = useState<'gr' | 'kg'>(
    initialData && initialWasteKg >= 1 ? 'kg' : 'gr'
  );
  const [wasteInput, setWasteInput] = useState<number>(
    initialData
      ? initialWasteKg < 1
        ? Math.round(initialWasteKg * 1000)
        : initialWasteKg
      : 450
  );

  // Air (Liter)
  const [waterLiter, setWaterLiter] = useState<number>(
    initialData ? Number(initialData.waterLiter) || 3 : 3
  );

  // Komposisi Bahan (Kulit Buah/Sayur atau Buah Segar Pilihan)
  const [organicWasteTypes, setOrganicWasteTypes] = useState(
    initialData
      ? initialData.organicWasteTypes || ''
      : getEnzymeTypeMeta(initialEnzymeType).defaultIngredients
  );

  const [startDate, setStartDate] = useState(() =>
    initialData ? formatDateInputWib(initialData.startDate) : todayWib
  );
  const [harvestEstimate, setHarvestEstimate] = useState(() =>
    initialData
      ? formatDateInputWib(initialData.harvestEstimate)
      : addDaysToDateInput(todayWib)
  );
  const [isCustomHarvestDate, setIsCustomHarvestDate] = useState(false);
  const [photoUrl, setPhotoUrl] = useState(initialData?.photoUrl || '');
  const [notes, setNotes] = useState(
    initialData
      ? initialData.notes || ''
      : successorOfBatch
      ? `Siklus baru wadah ${successorOfBatch.containerName}`
      : ''
  );
  const [status, setStatus] = useState<EcoEnzymeBatchStatus>(
    initialData?.status || 'IN_PROGRESS'
  );
  const [failureReason, setFailureReason] = useState<EnzymeFailureReason | ''>(
    initialData?.failureReason || ''
  );
  const [failureNotes, setFailureNotes] = useState(initialData?.failureNotes || '');
  const previousBatchId = initialData
    ? initialData.previousBatchId || null
    : successorOfBatch?.id || null;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const enzymeMeta = getEnzymeTypeMeta(enzymeType);
  const allowedSweeteners = getAllowedSweetenersForEnzyme(enzymeType);
  const sweetenerMeta = getSweetenerMeta(sweetenerType, enzymeType);

  const handleEnzymeTypeChange = (nextType: EnzymeType) => {
    if (isHarvestedLocked || nextType === enzymeType) return;

    const prevDefaultIngredients = getEnzymeTypeMeta(enzymeType).defaultIngredients;
    const nextMeta = getEnzymeTypeMeta(nextType);

    setEnzymeType(nextType);

    if (!isSweetenerAllowedForEnzyme(nextType, sweetenerType)) {
      setSweetenerType(getDefaultSweetenerForEnzyme(nextType));
    }

    if (!initialData) {
      const trimmedWaste = organicWasteTypes.trim();
      if (!trimmedWaste || trimmedWaste === prevDefaultIngredients) {
        setOrganicWasteTypes(nextMeta.defaultIngredients);
      }
    }
  };

  // Hitung ekuivalen kg untuk submit
  const finalMolassesKg = molassesUnit === 'gr' ? molassesInput / 1000 : molassesInput;
  const finalWasteKg = wasteUnit === 'gr' ? wasteInput / 1000 : wasteInput;

  // Tombol pintas kode galon
  const handleSuggestCode = () => {
    const randomNum = Math.floor(1 + Math.random() * 99);
    setBatchCode(`GL-${String(randomNum).padStart(2, '0')}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const parsedStart = new Date(startDate);
    if (!startDate || Number.isNaN(parsedStart.getTime())) {
      toast.error('Tanggal mulai fermentasi tidak valid.');
      return;
    }

    let parsedHarvestIso: string | undefined;
    if (harvestEstimate) {
      const parsedHarvest = new Date(harvestEstimate);
      if (Number.isNaN(parsedHarvest.getTime())) {
        toast.error('Tanggal estimasi panen tidak valid.');
        return;
      }
      parsedHarvestIso = parsedHarvest.toISOString();
    }

    const trimmedPhoto = photoUrl.trim();
    if (!isSafePhotoUrlInput(trimmedPhoto)) {
      toast.error('URL foto tidak valid. Gunakan awalan https://, http://, atau /.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        batchCode: batchCode.trim() || undefined,
        enzymeType,
        sweetenerType,
        containerName: containerName.trim(),
        containerCapacityLiter:
          Number(containerCapacityLiter) > 0
            ? Number(containerCapacityLiter)
            : Math.ceil(waterLiter * 1.3),
        molassesKg: Number(finalMolassesKg) || 0.15,
        organicWasteKg: Number(finalWasteKg) || 0.45,
        waterLiter: Number(waterLiter) || 3,
        organicWasteTypes: organicWasteTypes.trim() || enzymeMeta.defaultIngredients,
        startDate: parsedStart.toISOString(),
        harvestEstimate: parsedHarvestIso,
        photoUrl: trimmedPhoto ? trimmedPhoto : initialData ? null : undefined,
        notes: notes.trim() || undefined,
        ...(initialData
          ? {
              status,
              failureReason: status === 'FAILED' ? failureReason || null : null,
              failureNotes: status === 'FAILED' ? failureNotes.trim() || null : null,
            }
          : {
              previousBatchId: previousBatchId || undefined,
            }),
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-8 shadow-2xl border border-stone-200 my-2 sm:my-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-stone-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] sm:text-[11px] font-bold border border-emerald-200 mb-1">
              <Beaker className="w-3.5 h-3.5" />
              {initialData ? 'Edit Galon' : 'Input Galon Baru'}
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-stone-900">
              {initialData ? 'Ubah Data Galon Enzim' : 'Catat Galon Fermentasi Baru'}
            </h3>
            <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
              Data akan otomatis dibuatkan Barcode &amp; QR Code untuk ditempel pada fisik galon.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4 mt-4 sm:mt-5">
          {/* Read-Only Public Code Banner jika edit */}
          {initialData?.publicCode && (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-700" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Kode QR Publik</span>
                  <span className="font-mono font-bold text-stone-900">{initialData.publicCode}</span>
                </div>
              </div>
              <span className="text-[11px] text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 font-medium">
                Tersambung ke Barcode Galon
              </span>
            </div>
          )}

          {/* Lock Hint jika status HARVESTED */}
          {isHarvestedLocked && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 text-xs text-blue-900 flex items-start gap-2">
              <Lock className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Batch Sudah Dipanen (Formula Terkunci)</p>
                <p className="text-[11px] text-blue-800 mt-0.5">
                  Jenis enzim, pemanis, takaran bahan, dan tanggal mulai fermentasi tidak dapat diubah setelah galon dipanen.
                </p>
              </div>
            </div>
          )}

          {/* Suksesi Galon Alert */}
          {previousBatchId && !initialData && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Siklus Baru untuk Wadah: {containerName}</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  QR Code permanen milik wadah ini akan dipakai kembali secara otomatis (1 wadah = 1 QR Code), sehingga label fisik yang sudah ditempel tidak perlu diganti.
                </p>
              </div>
            </div>
          )}

          {/* Jenis Enzim Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800">
                Jenis Enzim <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-stone-500">
                Menentukan bahan &amp; pilihan pemanis
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isHarvestedLocked}
                onClick={() => handleEnzymeTypeChange('ECO_ENZYME')}
                className={`text-left rounded-2xl border p-3 transition-all ${
                  enzymeType === 'ECO_ENZYME'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-stone-900">
                    <Leaf className="w-3.5 h-3.5 text-emerald-700" />
                    Eco Enzyme
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Non-Konsumsi
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-snug">
                  Sampah organik (kulit buah/sayur) • Pemanis: Molase / Gula
                </p>
              </button>

              <button
                type="button"
                disabled={isHarvestedLocked}
                onClick={() => handleEnzymeTypeChange('CLASSIC_ENZYME')}
                className={`text-left rounded-2xl border p-3 transition-all ${
                  enzymeType === 'CLASSIC_ENZYME'
                    ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-stone-900">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Classic Enzyme
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    Konsumsi / Minum
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-snug">
                  Buah segar pilihan &amp; madu/gula berkualitas • Untuk dikonsumsi/diminum
                </p>
              </button>
            </div>
          </div>

          {/* Baris 1: Kode Galon & Nama Wadah */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-800">
                  Kode Galon <span className="text-stone-400 font-normal">(cth: GL-01)</span>
                </label>
                {!initialData && (
                  <button
                    type="button"
                    onClick={handleSuggestCode}
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline"
                  >
                    + Kode Otomatis
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="cth. GL-01"
                value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                disabled={!!initialData}
                className="w-full text-xs font-mono font-bold bg-white border border-stone-300 rounded-xl px-3 py-2.5 text-stone-900 focus:outline-none focus:border-emerald-600 disabled:bg-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Nama / Penanda Wadah <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="cth. Galon 1 / Toples Merah"
                value={containerName}
                onChange={(e) => setContainerName(e.target.value)}
                className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2.5 text-stone-900 focus:outline-none focus:border-emerald-600"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Jika nama wadah / kode galon sama dengan yang sudah ada, QR Code sebelumnya akan dipakai kembali (tidak membuat QR ganda).
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Kapasitas Wadah (Liter)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="cth. 5"
                value={containerCapacityLiter}
                onChange={(e) => setContainerCapacityLiter(parseFloat(e.target.value) || 0)}
                className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2.5 text-stone-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Baris 2: Tanggal Buat & Tanggal Panen */}
          <div className="bg-[#FAFBF9] border border-stone-200 rounded-2xl p-3.5 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Tanggal Buat: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  disabled={isHarvestedLocked}
                  value={startDate}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setStartDate(newStart);
                    if (newStart && !isCustomHarvestDate) {
                      const parsed = new Date(newStart);
                      if (!Number.isNaN(parsed.getTime())) {
                        const nextEstimate = addDaysToDateInput(newStart);
                        if (nextEstimate) {
                          setHarvestEstimate(nextEstimate);
                        }
                      }
                    }
                  }}
                  className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-emerald-600 disabled:bg-stone-100 disabled:text-stone-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-800">
                    Tanggal Panen: <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    disabled={isHarvestedLocked}
                    onClick={() => {
                      if (startDate) {
                        const parsed = new Date(startDate);
                        if (!Number.isNaN(parsed.getTime())) {
                          const nextEstimate = addDaysToDateInput(startDate);
                          if (nextEstimate) {
                            setHarvestEstimate(nextEstimate);
                            setIsCustomHarvestDate(false);
                          }
                        }
                      }
                    }}
                    className="text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Hitung ulang otomatis 90 hari kalender dari tanggal buat"
                  >
                    +90 Hari (Otomatis)
                  </button>
                </div>
                <input
                  type="date"
                  required
                  value={harvestEstimate}
                  onChange={(e) => {
                    setHarvestEstimate(e.target.value);
                    setIsCustomHarvestDate(true);
                  }}
                  className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Baris 3: Formulasi Bahan (Pemanis, Air, Sampah BO / Buah Segar) */}
          <div className="border border-stone-200 rounded-2xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-700" />
                Takaran Bahan (Rumus 1 : 3 : 10)
              </span>
              <span className="text-[11px] text-stone-400">
                {sweetenerMeta.label} : {enzymeMeta.materialShortLabel} : Air
              </span>
            </div>

            {/* Jenis Pemanis Selector */}
            <div className="bg-[#FAFBF9] border border-stone-200 rounded-xl p-2.5 space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-stone-800">
                  Jenis Pemanis ({enzymeMeta.label}) <span className="text-rose-500">*</span>
                </span>
                <div className="inline-flex rounded-lg bg-stone-200/70 p-0.5 gap-1 self-start sm:self-auto">
                  {allowedSweeteners.map((option) => {
                    const optionMeta = getSweetenerMeta(option, enzymeType);
                    const isSelected = sweetenerType === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={isHarvestedLocked}
                        onClick={() => setSweetenerType(option)}
                        className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${
                          isSelected
                            ? enzymeType === 'CLASSIC_ENZYME'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-[#012D1D] text-white shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        {optionMeta.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="text-[10px] text-stone-500 leading-snug">
                {sweetenerMeta.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Air */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Droplet className="w-3 h-3 text-sky-600" /> Air Bersih <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    disabled={isHarvestedLocked}
                    value={waterLiter}
                    onChange={(e) => setWaterLiter(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-bold text-stone-900 bg-stone-50 border border-stone-300 rounded-l-xl px-2.5 py-2 focus:outline-none focus:border-emerald-600 disabled:bg-stone-100 disabled:text-stone-500"
                  />
                  <span className="bg-stone-200 text-stone-700 px-2.5 py-2 text-xs font-bold rounded-r-xl border border-l-0 border-stone-300">
                    L
                  </span>
                </div>
              </div>

              {/* Pemanis */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Pemanis ({sweetenerMeta.label}) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    disabled={isHarvestedLocked}
                    value={molassesInput}
                    onChange={(e) => setMolassesInput(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-bold text-stone-900 bg-stone-50 border border-stone-300 rounded-l-xl px-2.5 py-2 focus:outline-none focus:border-emerald-600 disabled:bg-stone-100 disabled:text-stone-500"
                  />
                  <select
                    value={molassesUnit}
                    disabled={isHarvestedLocked}
                    onChange={(e) => setMolassesUnit(e.target.value as 'gr' | 'kg')}
                    className="bg-stone-200 text-stone-700 px-1 py-2 text-xs font-bold rounded-r-xl border border-l-0 border-stone-300 focus:outline-none disabled:opacity-60"
                  >
                    <option value="gr">gr</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>

              {/* Bahan Organik / Buah Segar */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  {enzymeMeta.materialLabel} <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    disabled={isHarvestedLocked}
                    value={wasteInput}
                    onChange={(e) => setWasteInput(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-bold text-stone-900 bg-stone-50 border border-stone-300 rounded-l-xl px-2.5 py-2 focus:outline-none focus:border-emerald-600 disabled:bg-stone-100 disabled:text-stone-500"
                  />
                  <select
                    value={wasteUnit}
                    disabled={isHarvestedLocked}
                    onChange={(e) => setWasteUnit(e.target.value as 'gr' | 'kg')}
                    className="bg-stone-200 text-stone-700 px-1 py-2 text-xs font-bold rounded-r-xl border border-l-0 border-stone-300 focus:outline-none disabled:opacity-60"
                  >
                    <option value="gr">gr</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Baris 4: Komposisi Bahan */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
              <Apple className="w-3.5 h-3.5 text-emerald-700" />
              {enzymeType === 'CLASSIC_ENZYME'
                ? 'Komposisi Buah Segar Pilihan'
                : 'Komposisi Kulit Buah / Sayur (Sampah Organik)'}{' '}
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder={enzymeMeta.ingredientsPlaceholder}
              value={organicWasteTypes}
              onChange={(e) => setOrganicWasteTypes(e.target.value)}
              className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-emerald-600 placeholder:text-stone-400"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              {enzymeMeta.ingredientsHelper}
            </p>
          </div>

          {/* Opsi Edit Status & Failure jika edit */}
          {initialData && (
            <div className="p-3 border border-stone-200 rounded-2xl bg-stone-50 space-y-2.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Status Fermentasi Galon
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EcoEnzymeBatchStatus)}
                  className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-800"
                >
                  <option value="IN_PROGRESS">Sedang Berjalan (Fermentasi)</option>
                  <option value="FAILED">Gagal / Terkontaminasi</option>
                  {initialData.status === 'HARVESTED' && (
                    <option value="HARVESTED">Sudah Dipanen</option>
                  )}
                </select>
              </div>

              {status === 'FAILED' && (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-rose-800 mb-1">
                      Alasan Kegagalan
                    </label>
                    <select
                      value={failureReason}
                      onChange={(e) => setFailureReason(e.target.value as EnzymeFailureReason | '')}
                      className="w-full text-xs bg-white border border-rose-300 rounded-xl px-3 py-2 text-stone-800"
                    >
                      <option value="">Pilih Alasan</option>
                      <option value="KONTAMINASI_JAMUR_HITAM">Kontaminasi Jamur Hitam</option>
                      <option value="AROMA_BUSUK_MENYENGAT">Aroma Busuk Menyengat</option>
                      <option value="WADAH_BOCOR_RUSAK">Wadah Bocor/Rusak</option>
                      <option value="LAINNYA">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-rose-800 mb-1">
                      Catatan Kegagalan (Opsional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="cth. Tutup wadah sempat longgar sehingga terkontaminasi jamur hitam..."
                      value={failureNotes}
                      onChange={(e) => setFailureNotes(e.target.value)}
                      className="w-full text-xs bg-white border border-rose-300 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* URL Foto Galon (Opsional) */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              URL Foto Galon (Opsional)
            </label>
            <input
              type="text"
              placeholder="cth. https://... atau /images/galon-1.jpg"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Catatan Tambahan (Opsional) */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Catatan / Lokasi Galon (Opsional)
            </label>
            <input
              type="text"
              placeholder="cth. Di rak fermentasi kebun bibit, ditangani Ibu RT"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-emerald-600"
            />
          </div>

          {/* Tombol Aksi */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#012D1D] hover:bg-[#0B4A31] text-xs font-bold text-white shadow transition-all active:scale-95 disabled:opacity-50"
            >
              <QrCode className="w-4 h-4 text-emerald-300" />
              {isSubmitting
                ? 'Menyimpan...'
                : initialData
                ? 'Simpan Perubahan'
                : 'Simpan & Buat Barcode / QR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
