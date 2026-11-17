'use client';

import React, { useState, useEffect } from 'react';
import { X, QrCode, Lock, Sparkles, Calendar, Beaker, Apple, Droplet, Scale } from 'lucide-react';
import { EcoEnzymeBatch, EnzymeFailureReason } from '@/types';

interface EcoEnzymeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: EcoEnzymeBatch | null;
  successorOfBatch?: EcoEnzymeBatch | null;
}

export function EcoEnzymeModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  successorOfBatch,
}: EcoEnzymeModalProps) {
  const [batchCode, setBatchCode] = useState('');
  const [containerName, setContainerName] = useState('');
  const [containerCapacityLiter, setContainerCapacityLiter] = useState<number>(5);
  
  // Satuan & Nilai Pemanis (Madu / Gula)
  const [molassesUnit, setMolassesUnit] = useState<'gr' | 'kg'>('gr');
  const [molassesInput, setMolassesInput] = useState<number>(150);

  // Satuan & Nilai Bahan Organik (BO)
  const [wasteUnit, setWasteUnit] = useState<'gr' | 'kg'>('gr');
  const [wasteInput, setWasteInput] = useState<number>(450);

  // Air (Liter)
  const [waterLiter, setWaterLiter] = useState<number>(3);

  // Komposisi Kulit Buah & Daun (BO)
  const [organicWasteTypes, setOrganicWasteTypes] = useState('');

  const [startDate, setStartDate] = useState('');
  const [harvestEstimate, setHarvestEstimate] = useState('');
  const [isCustomHarvestDate, setIsCustomHarvestDate] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<string>('IN_PROGRESS');
  const [failureReason, setFailureReason] = useState<EnzymeFailureReason | ''>('');
  const [failureNotes, setFailureNotes] = useState('');
  const [previousBatchId, setPreviousBatchId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setBatchCode(initialData.batchCode || '');
      setContainerName(initialData.containerName || '');
      setContainerCapacityLiter(Number(initialData.containerCapacityLiter) || 5);
      
      const mKg = Number(initialData.molassesKg) || 0.15;
      if (mKg < 1) {
        setMolassesUnit('gr');
        setMolassesInput(Math.round(mKg * 1000));
      } else {
        setMolassesUnit('kg');
        setMolassesInput(mKg);
      }

      const wKg = Number(initialData.organicWasteKg) || 0.45;
      if (wKg < 1) {
        setWasteUnit('gr');
        setWasteInput(Math.round(wKg * 1000));
      } else {
        setWasteUnit('kg');
        setWasteInput(wKg);
      }

      setWaterLiter(Number(initialData.waterLiter) || 3);
      setOrganicWasteTypes(initialData.organicWasteTypes || '');
      setStartDate(initialData.startDate ? initialData.startDate.slice(0, 10) : '');
      setHarvestEstimate(initialData.harvestEstimate ? initialData.harvestEstimate.slice(0, 10) : '');
      setIsCustomHarvestDate(false);
      setPhotoUrl(initialData.photoUrl || '');
      setNotes(initialData.notes || '');
      setStatus(initialData.status || 'IN_PROGRESS');
      setFailureReason(initialData.failureReason || '');
      setFailureNotes(initialData.failureNotes || '');
      setPreviousBatchId(initialData.previousBatchId || null);
    } else if (successorOfBatch) {
      setBatchCode('');
      setContainerName(successorOfBatch.containerName || '');
      setContainerCapacityLiter(Number(successorOfBatch.containerCapacityLiter) || 5);
      setMolassesUnit('gr');
      setMolassesInput(150);
      setWasteUnit('gr');
      setWasteInput(450);
      setWaterLiter(3);
      setOrganicWasteTypes('Semangka, Melon, Nanas, Pepaya, Mangga');
      const today = new Date().toISOString().slice(0, 10);
      setStartDate(today);
      const est = new Date();
      est.setDate(est.getDate() + 89);
      setHarvestEstimate(est.toISOString().slice(0, 10));
      setIsCustomHarvestDate(false);
      setPhotoUrl('');
      setNotes(`Siklus baru wadah ${successorOfBatch.containerName}`);
      setStatus('IN_PROGRESS');
      setFailureReason('');
      setFailureNotes('');
      setPreviousBatchId(successorOfBatch.id);
    } else {
      setBatchCode('');
      setContainerName('');
      setContainerCapacityLiter(5);
      setMolassesUnit('gr');
      setMolassesInput(150);
      setWasteUnit('gr');
      setWasteInput(450);
      setWaterLiter(3);
      setOrganicWasteTypes('Semangka, Melon, Nanas, Pepaya, Mangga');
      const today = new Date().toISOString().slice(0, 10);
      setStartDate(today);
      const est = new Date();
      est.setDate(est.getDate() + 89);
      setHarvestEstimate(est.toISOString().slice(0, 10));
      setIsCustomHarvestDate(false);
      setPhotoUrl('');
      setNotes('');
      setStatus('IN_PROGRESS');
      setFailureReason('');
      setFailureNotes('');
      setPreviousBatchId(null);
    }
  }, [initialData, successorOfBatch, isOpen]);

  if (!isOpen) return null;


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
    setIsSubmitting(true);
    try {
      await onSubmit({
        batchCode: batchCode.trim() || undefined,
        containerName: containerName.trim(),
        containerCapacityLiter: Number(containerCapacityLiter) || Math.ceil(waterLiter * 1.3),
        molassesKg: Number(finalMolassesKg) || 0.15,
        organicWasteKg: Number(finalWasteKg) || 0.45,
        waterLiter: Number(waterLiter) || 3,
        organicWasteTypes: organicWasteTypes.trim() || 'Kulit Buah Campur',
        startDate: new Date(startDate).toISOString(),
        harvestEstimate: harvestEstimate ? new Date(harvestEstimate).toISOString() : undefined,
        photoUrl: photoUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        ...(initialData
          ? {
              status,
              failureReason: status === 'FAILED' ? failureReason || undefined : undefined,
              failureNotes: status === 'FAILED' ? failureNotes.trim() || undefined : undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl border border-stone-200 my-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-100">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 mb-1">
              <Beaker className="w-3.5 h-3.5" />
              {initialData ? 'Edit Galon' : 'Input Galon Baru'}
            </div>
            <h3 className="text-xl font-bold text-stone-900">
              {initialData ? 'Ubah Data Galon Eco Enzyme' : 'Catat Galon Fermentasi Baru'}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Data akan otomatis dibuatkan Barcode & QR Code untuk ditempel pada fisik galon.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
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

          {/* Suksesi Galon Alert */}
          {previousBatchId && !initialData && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Siklus Baru untuk Wadah: {containerName}</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Sistem akan membuat Barcode & QR Code baru untuk menggantikan label lama pada wadah ini.
                </p>
              </div>
            </div>
          )}

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
                  value={startDate}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setStartDate(newStart);
                    if (newStart && !isCustomHarvestDate) {
                      const d = new Date(newStart);
                      d.setDate(d.getDate() + 89);
                      setHarvestEstimate(d.toISOString().slice(0, 10));
                    }
                  }}
                  className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-800">
                    Tanggal Panen: <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (startDate) {
                        const d = new Date(startDate);
                        d.setDate(d.getDate() + 89);
                        setHarvestEstimate(d.toISOString().slice(0, 10));
                        setIsCustomHarvestDate(false);
                      }
                    }}
                    className="text-[10px] text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
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

          {/* Baris 3: Formulasi Bahan (Air, Pemanis/Madu, Sampah BO) */}
          <div className="border border-stone-200 rounded-2xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-700" />
                Takaran Bahan (Rumus 1 : 3 : 10)
              </span>
              <span className="text-[11px] text-stone-400">
                Pemanis : Sampah : Air
              </span>
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
                    value={waterLiter}
                    onChange={(e) => setWaterLiter(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-bold text-stone-900 bg-stone-50 border border-stone-300 rounded-l-xl px-2.5 py-2 focus:outline-none focus:border-emerald-600"
                  />
                  <span className="bg-stone-200 text-stone-700 px-2.5 py-2 text-xs font-bold rounded-r-xl border border-l-0 border-stone-300">
                    L
                  </span>
                </div>
              </div>

              {/* Pemanis (Gula / Madu) */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Pemanis / Gula / Madu <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={molassesInput}
                    onChange={(e) => setMolassesInput(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-bold text-stone-900 bg-stone-50 border border-stone-300 rounded-l-xl px-2.5 py-2 focus:outline-none focus:border-emerald-600"
                  />
                  <select
                    value={molassesUnit}
                    onChange={(e) => setMolassesUnit(e.target.value as 'gr' | 'kg')}
                    className="bg-stone-200 text-stone-700 px-1 py-2 text-xs font-bold rounded-r-xl border border-l-0 border-stone-300 focus:outline-none"
                  >
                    <option value="gr">gr</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>

              {/* Sampah Organik (BO) */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Bahan Organik (BO) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={wasteInput}
                    onChange={(e) => setWasteInput(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-bold text-stone-900 bg-stone-50 border border-stone-300 rounded-l-xl px-2.5 py-2 focus:outline-none focus:border-emerald-600"
                  />
                  <select
                    value={wasteUnit}
                    onChange={(e) => setWasteUnit(e.target.value as 'gr' | 'kg')}
                    className="bg-stone-200 text-stone-700 px-1 py-2 text-xs font-bold rounded-r-xl border border-l-0 border-stone-300 focus:outline-none"
                  >
                    <option value="gr">gr</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Baris 4: Komposisi Kulit Buah & Daun (BO) */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1.5">
              <Apple className="w-3.5 h-3.5 text-emerald-700" />
              Komposisi Kulit Buah (BO) <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="cth. Semangka, Melon, Nanas, Pepaya, Mangga"
              value={organicWasteTypes}
              onChange={(e) => setOrganicWasteTypes(e.target.value)}
              className="w-full text-xs bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-800 focus:outline-none focus:border-emerald-600 placeholder:text-stone-400"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Sebutkan jenis kulit buah dan daun yang dimasukkan (pisahkan dengan koma).
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
                  onChange={(e) => setStatus(e.target.value)}
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
                <div>
                  <label className="block text-[11px] font-bold text-rose-800 mb-1">
                    Alasan Kegagalan
                  </label>
                  <select
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value as any)}
                    className="w-full text-xs bg-white border border-rose-300 rounded-xl px-3 py-2 text-stone-800"
                  >
                    <option value="">Pilih Alasan</option>
                    <option value="KONTAMINASI_JAMUR_HITAM">Kontaminasi Jamur Hitam</option>
                    <option value="AROMA_BUSUK_MENYENGAT">Aroma Busuk Menyengat</option>
                    <option value="WADAH_BOCOR_RUSAK">Wadah Bocor/Rusak</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>
              )}
            </div>
          )}

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
