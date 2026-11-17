'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Activity, CheckCircle2 } from 'lucide-react';
import { EcoEnzymeBatch, EcoEnzymeLog } from '@/types';
import { ecoEnzymeApi } from '@/lib/api/eco-enzyme';
import { toast } from 'sonner';

interface EcoEnzymeLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: EcoEnzymeBatch | null;
  onRefreshBatch: () => void;
}

export function EcoEnzymeLogModal({
  isOpen,
  onClose,
  batch,
  onRefreshBatch,
}: EcoEnzymeLogModalProps) {
  const [logs, setLogs] = useState<EcoEnzymeLog[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [dayNumber, setDayNumber] = useState<number>(7);
  const [phLevel, setPhLevel] = useState<string>('3.8');
  const [aromaStatus, setAromaStatus] = useState<string>('Asam Segar Khas Buah');
  const [fungusColor, setFungusColor] = useState<string>('Lapisan jamur putih bersih (Mama Enzim / Scoby)');
  const [actionTaken, setActionTaken] = useState<string>('Buka tutup wadah 1 menit buang gas CO2');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDayTemplateChange = (d: number) => {
    setDayNumber(d);
    if (d === 7) {
      setActionTaken('Buka tutup wadah 1 menit buang gas CO2, bersihkan bibir wadah');
      setFungusColor('Bercak putih tipis');
    } else if (d === 30) {
      setActionTaken('Periksa ketebalan jamur putih dan aduk lembut jika perlu');
      setFungusColor('Lapisan jamur putih bersih (Mama Enzim / Scoby)');
    } else if (d === 60) {
      setActionTaken('Pengecekan stabilitas cairan dan uji pH');
      setPhLevel('3.6');
    } else if (d === 90) {
      setActionTaken('Pemeriksaan pra-panen dan persiapan kain saring');
      setPhLevel('3.4');
    }
  };

  useEffect(() => {
    if (batch?.id && isOpen) {
      ecoEnzymeApi.getById(batch.id).then((fullBatch) => {
        setLogs(fullBatch.inspectionLogs || []);
      }).catch((err) => {
        console.error('Failed to load logs:', err);
      });
    }
  }, [batch?.id, isOpen]);

  if (!isOpen || !batch) return null;

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await ecoEnzymeApi.addLog(batch.id, {
        dayNumber: Number(dayNumber),
        phLevel: phLevel ? parseFloat(phLevel) : null,
        aromaStatus: aromaStatus || null,
        fungusColor: fungusColor || null,
        actionTaken: actionTaken || null,
        notes: notes || null,
      });
      toast.success('Catatan inspeksi berhasil ditambahkan');
      setShowAddForm(false);
      // Reload logs
      const fullBatch = await ecoEnzymeApi.getById(batch.id);
      setLogs(fullBatch.inspectionLogs || []);
      onRefreshBatch();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambahkan log');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Hapus catatan inspeksi ini?')) return;
    try {
      await ecoEnzymeApi.deleteLog(logId);
      toast.success('Catatan log berhasil dihapus');
      setLogs((prev) => prev.filter((l) => l.id !== logId));
      onRefreshBatch();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus log');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-8 shadow-2xl border border-[#E3E8DC] my-2 sm:my-8 max-h-[92vh] flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#EDF2E8]">
          <div className="min-w-0 pr-2">
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#F0F4EC] text-[#2C5F2D]">
              {batch.batchCode}
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-[#1A2F1D] mt-1 truncate">
              Catatan Inspeksi: {batch.containerName}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-[#6C7665] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LOG LIST & ADD FORM */}
        <div className="flex-1 overflow-y-auto py-3.5 sm:py-5 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6C7665]">
              Riwayat Pengecekan Berkala ({logs.length})
            </span>
            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#2C5F2D] hover:bg-[#234D24] text-white text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Pengecekan
              </button>
            )}
          </div>

          {/* FORM TAMBAH LOG BARU */}
          {showAddForm && (
            <form onSubmit={handleAddLog} className="bg-[#FAFBF9] p-5 rounded-2xl border border-[#E5EBE0] space-y-4">
              <div className="flex items-center justify-between border-b border-[#EDF2E8] pb-2">
                <span className="text-xs font-bold text-[#2C5F2D] uppercase tracking-wider">
                  Formulir Inspeksi Baru
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-[#828C7A] hover:text-[#1A2F1D]"
                >
                  Batal
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Jadwal / Hari Ke-
                  </label>
                  <select
                    value={dayNumber}
                    onChange={(e) => handleDayTemplateChange(parseInt(e.target.value) || 7)}
                    className="w-full text-xs bg-white border border-stone-300 rounded-lg px-2.5 py-2 text-stone-800"
                  >
                    <option value={7}>Hari ke-7 (Pelepasan gas awal)</option>
                    <option value={30}>Hari ke-30 (Pemeriksaan jamur & alkohol)</option>
                    <option value={60}>Hari ke-60 (Evaluasi kestabilan)</option>
                    <option value={90}>Hari ke-90 (Pemeriksaan pra-panen)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Kadar pH (Ideal matang &lt; 4.0)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="14"
                    value={phLevel}
                    onChange={(e) => setPhLevel(e.target.value)}
                    placeholder="cth. 3.5"
                    className="w-full text-xs bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-800"
                  />
                  <span className="text-[10px] text-stone-400 block mt-0.5">Target pH matang: di bawah 4.0</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Kondisi Permukaan / Jamur
                  </label>
                  <select
                    value={fungusColor}
                    onChange={(e) => setFungusColor(e.target.value)}
                    className="w-full text-xs bg-white border border-stone-300 rounded-lg px-2.5 py-2 text-stone-800"
                  >
                    <option value="Lapisan jamur putih bersih (Mama Enzim / Scoby)">Lapisan jamur putih (Mama Enzim sehat)</option>
                    <option value="Tidak ada jamur permukaan">Tidak ada jamur (Permukaan bersih)</option>
                    <option value="Bercak putih tipis">Bercak putih tipis</option>
                    <option value="Jamur hitam / abu gelap (PERINGATAN)">Jamur hitam / abu gelap (PERINGATAN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Kondisi Aroma
                  </label>
                  <select
                    value={aromaStatus}
                    onChange={(e) => setAromaStatus(e.target.value)}
                    className="w-full text-xs bg-white border border-stone-300 rounded-lg px-2.5 py-2 text-stone-800"
                  >
                    <option value="Asam Segar Khas Buah">Asam Segar Khas Buah (Ideal)</option>
                    <option value="Aroma Alkohol / Fermentasi Kuat">Aroma Alkohol / Fermentasi Kuat</option>
                    <option value="Asam Tajam seperti Cuka">Asam Tajam seperti Cuka</option>
                    <option value="Bau Kurang Sedap / Menyengat">Bau Kurang Sedap / Menyengat</option>
                    <option value="Bau Busuk / Bangkai">Bau Busuk / Bangkai (Gagal)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Tindakan Operasional yang Dilakukan
                </label>
                <input
                  type="text"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="cth. Buka tutup wadah 1 menit buang gas CO2, bersihkan bibir wadah"
                  className="w-full text-xs bg-white border border-stone-300 rounded-lg px-3 py-2 text-stone-800 focus:outline-none focus:border-stone-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="cth. Suhu ruang penyimpanan 29°C, cairan mulai kecokelatan jernih..."
                  className="w-full text-xs bg-white border border-[#D5E0CF] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2C5F2D]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl border border-[#D5E0CF] text-xs font-bold text-[#6C7665]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#2C5F2D] text-xs font-bold text-white shadow-sm"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Log'}
                </button>
              </div>
            </form>
          )}

          {/* DAFTAR LOG */}
          {logs.length === 0 ? (
            <div className="text-center py-10 bg-[#FAFBF9] rounded-2xl border border-dashed border-[#D5E0CF]">
              <Activity className="w-8 h-8 text-[#A0ACA0] mx-auto mb-2" />
              <p className="text-xs text-[#6C7665]">Belum ada riwayat pengecekan untuk batch ini.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-white rounded-2xl p-4 border border-[#E3E8DC] shadow-sm flex items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2C5F2D] bg-[#EEF5EC] px-2 py-0.5 rounded-md">
                        <Calendar className="w-3 h-3" />
                        {new Date(log.logDate).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      {log.phLevel && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                          pH: {Number(log.phLevel)}
                        </span>
                      )}
                    </div>

                    {log.aromaStatus && (
                      <p className="text-xs text-[#42493E]">
                        <strong>Aroma:</strong> {log.aromaStatus}
                      </p>
                    )}
                    {log.fungusColor && (
                      <p className="text-xs text-[#42493E]">
                        <strong>Kondisi Jamur:</strong> {log.fungusColor}
                      </p>
                    )}
                    {log.actionTaken && (
                      <p className="text-xs text-[#2C5F2D]">
                        <strong>Tindakan:</strong> {log.actionTaken}
                      </p>
                    )}
                    {log.notes && (
                      <p className="text-[11px] text-[#6C7665] italic">
                        "{log.notes}"
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => log.id && handleDeleteLog(log.id)}
                    className="p-1.5 rounded-lg text-[#9EA89A] hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Hapus Log"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-[#EDF2E8] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-[#2C5F2D] text-xs font-bold text-white shadow-sm"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
