'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, PackageCheck } from 'lucide-react';
import { EcoEnzymeBatch, EnzymeResidueUsage, Product } from '@/types';
import { ecoEnzymeApi } from '@/lib/api/eco-enzyme';
import { getTodayWibDateInput } from '@/lib/eco-enzyme';
import { toast } from 'sonner';

export interface EcoEnzymeHarvestSubmitData {
  actualHarvestDate: string;
  harvestLiter: number;
  residueUsage?: EnzymeResidueUsage;
  residueNotes?: string;
  allocatedProductId?: string;
  allocatedUnitsAdded?: number;
  notes?: string;
}

interface EcoEnzymeHarvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EcoEnzymeHarvestSubmitData) => Promise<void>;
  batch: EcoEnzymeBatch | null;
}

export function EcoEnzymeHarvestModal({
  isOpen,
  onClose,
  onSubmit,
  batch,
}: EcoEnzymeHarvestModalProps) {
  if (!isOpen || !batch) return null;

  return (
    <EcoEnzymeHarvestModalContent
      key={batch.id}
      batch={batch}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

function EcoEnzymeHarvestModalContent({
  batch,
  onClose,
  onSubmit,
}: {
  batch: EcoEnzymeBatch;
  onClose: () => void;
  onSubmit: (data: EcoEnzymeHarvestSubmitData) => Promise<void>;
}) {
  const [actualHarvestDate, setActualHarvestDate] = useState(() => getTodayWibDateInput());
  const [harvestLiter, setHarvestLiter] = useState<number>(
    () => Math.round(Number(batch.waterLiter) * 0.85 * 10) / 10
  );
  const [residueUsage, setResidueUsage] = useState<EnzymeResidueUsage>('KOMPOS_PADAT');
  const [residueNotes, setResidueNotes] = useState('');

  // Alokasi ke katalog produk
  const [products, setProducts] = useState<Product[]>([]);
  const [isAllocatingProduct, setIsAllocatingProduct] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [unitsToAdd, setUnitsToAdd] = useState<number>(10);

  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ecoEnzymeApi
      .getProducts()
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, []);

  // Total input bahan untuk perhitungan rendemen
  const totalInputKg =
    Number(batch.molassesKg) + Number(batch.organicWasteKg) + Number(batch.waterLiter);
  const rendemenPercent =
    totalInputKg > 0 ? Math.round((harvestLiter / totalInputKg) * 100 * 10) / 10 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const parsedDate = new Date(actualHarvestDate);
    if (!actualHarvestDate || Number.isNaN(parsedDate.getTime())) {
      toast.error('Tanggal panen aktual tidak valid.');
      return;
    }

    if (!Number.isFinite(harvestLiter) || harvestLiter <= 0) {
      toast.error('Volume panen bersih harus lebih dari 0 liter.');
      return;
    }

    if (isAllocatingProduct) {
      if (!selectedProductId) {
        toast.error('Silakan pilih produk di katalog untuk alokasi hasil panen.');
        return;
      }
      if (!Number.isInteger(unitsToAdd) || unitsToAdd < 1) {
        toast.error('Jumlah unit stok yang ditambahkan minimal 1.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        actualHarvestDate: parsedDate.toISOString(),
        harvestLiter: Number(harvestLiter),
        residueUsage,
        residueNotes: residueNotes.trim() || undefined,
        allocatedProductId: isAllocatingProduct && selectedProductId ? selectedProductId : undefined,
        allocatedUnitsAdded: isAllocatingProduct && selectedProductId ? Number(unitsToAdd) : undefined,
        notes: notes.trim() || undefined,
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
      <div className="bg-white rounded-2xl max-w-xl w-full p-4 sm:p-8 shadow-xl border border-stone-200 my-2 sm:my-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-stone-200">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900">
              Konfirmasi Panen Eco Enzyme
            </h3>
            <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
              Pencatatan volume hasil saring dan hilirisasi stok produk katalog
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4 mt-3.5 sm:mt-4">
          {/* Ringkasan Input Awal */}
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs grid grid-cols-2 gap-2 text-stone-700">
            <div>
              <span className="text-stone-500 block text-[10px]">Kode Batch</span>
              <span className="font-mono font-bold text-stone-900">{batch.batchCode}</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px]">Wadah / Lokasi</span>
              <span className="font-semibold text-stone-900">{batch.containerName}</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px]">Sampah Organik Terolah</span>
              <span className="font-semibold text-emerald-800">{Number(batch.organicWasteKg)} kg</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px]">Air Awal</span>
              <span className="font-semibold text-sky-800">{Number(batch.waterLiter)} Liter</span>
            </div>
          </div>

          {/* Tanggal & Volume Panen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Tanggal Panen Aktual <span className="text-rose-600">*</span>
              </label>
              <input
                type="date"
                required
                value={actualHarvestDate}
                onChange={(e) => setActualHarvestDate(e.target.value)}
                className="w-full text-xs bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:border-stone-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Volume Panen Bersih (Liter) <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={harvestLiter}
                onChange={(e) => setHarvestLiter(parseFloat(e.target.value) || 0)}
                className="w-full text-sm font-bold text-emerald-800 bg-white border border-stone-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-stone-800"
              />
            </div>
          </div>

          {/* Indikator Rendemen Efisiensi */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
            <span className="text-stone-700 font-medium">
              Efisiensi Ekstraksi (Rendemen):
            </span>
            <span className="font-bold text-emerald-800">
              {rendemenPercent}% <span className="font-normal text-stone-500 text-[11px]">(Standar: 60–75%)</span>
            </span>
          </div>

          {/* Pemanfaatan Ampas */}
          <div className="border border-stone-200 rounded-xl p-3.5 bg-stone-50/50 space-y-2.5">
            <label className="block text-xs font-semibold text-stone-800">
              Pemanfaatan Ampas Sisa Panen
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'KOMPOS_PADAT', label: 'Kompos Padat Kebun' },
                { id: 'PUPUK_ORGANIK', label: 'Pupuk Organik Cair/Kering' },
                { id: 'STARTER_BATCH_BARU', label: 'Starter Batch Baru' },
                { id: 'PENGHARUM_TOILET', label: 'Pengurai Saluran Toilet' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    residueUsage === opt.id
                      ? 'bg-white border-emerald-700 text-emerald-900 font-medium shadow-sm'
                      : 'border-stone-200 text-stone-600 hover:bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="residueUsage"
                    value={opt.id}
                    checked={residueUsage === opt.id}
                    onChange={() => setResidueUsage(opt.id as EnzymeResidueUsage)}
                    className="accent-emerald-700"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            <input
              type="text"
              placeholder="Catatan ampas: cth. 4 kg ampas dimasukkan ke komposter RT 03"
              value={residueNotes}
              onChange={(e) => setResidueNotes(e.target.value)}
              className="w-full text-xs bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-stone-800 focus:outline-none focus:border-stone-800"
            />
          </div>

          {/* Integrasi Alokasi ke Katalog Produk */}
          <div className="border border-stone-200 rounded-xl p-3.5 bg-stone-50/50 space-y-2.5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-800">
              <input
                type="checkbox"
                checked={isAllocatingProduct}
                onChange={(e) => setIsAllocatingProduct(e.target.checked)}
                className="accent-emerald-700 w-4 h-4 rounded"
              />
              <span className="flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-emerald-800" />
                Alokasikan Hasil Panen ke Stok Produk Katalog
              </span>
            </label>

            {isAllocatingProduct && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-stone-200">
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">
                    Pilih Produk di Katalog <span className="text-rose-600">*</span>
                  </label>
                  <select
                    required={isAllocatingProduct}
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full text-xs bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-800"
                  >
                    <option value="">-- Pilih Produk --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stok saat ini: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">
                    Tambah Jumlah Unit Stok
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={unitsToAdd}
                    onChange={(e) => setUnitsToAdd(parseInt(e.target.value) || 0)}
                    className="w-full text-xs bg-white border border-stone-300 rounded-lg px-3 py-1.5 text-stone-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Catatan Kualitas Panen */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Catatan Kualitas Panen (Warna, pH, Aroma)
            </label>
            <textarea
              rows={2}
              placeholder="cth. Warna cokelat keemasan bening, aroma asam buah segar, pH 3.4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:border-stone-800"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-stone-300 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Menyimpan...' : 'Konfirmasi & Selesaikan Panen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

