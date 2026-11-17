'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Calendar,
  Droplet,
  Scale,
  Apple,
  Smartphone,
  Wifi,
  Globe,
  Settings,
  RotateCcw,
} from 'lucide-react';
import { EcoEnzymeBatch, QrCodeRecord } from '@/types';
import { ecoEnzymeApi } from '@/lib/api/eco-enzyme';
import { buildBatchUrl, isTemporaryBaseUrl } from '@/lib/batch-url';
import { parseOrganicWasteTypes } from '@/lib/eco-enzyme';
import { PersistentQrCode } from '@/components/shared/PersistentQrCode';
import { toast } from 'sonner';

interface EcoEnzymeQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: EcoEnzymeBatch | null;
  onQrPrinted?: () => void;
  onQrSaved?: (qr: QrCodeRecord) => void;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

export function EcoEnzymeQrModal({
  isOpen,
  onClose,
  batch,
  onQrPrinted,
  onQrSaved,
}: EcoEnzymeQrModalProps) {
  const [copied, setCopied] = useState(false);
  const [savedQrOverride, setSavedQrOverride] = useState<{
    batchId: string;
    qrCode: QrCodeRecord;
  } | null>(null);
  const [customBaseUrl, setCustomBaseUrl] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tp_qr_base_url') || '';
    }
    return '';
  });
  const [detectedWifiIp, setDetectedWifiIp] = useState<string | null>(null);
  const [showDomainInput, setShowDomainInput] = useState(false);
  const [domainInputVal, setDomainInputVal] = useState('');

  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/network-ip')
      .then((res) => res.json())
      .then((data) => {
        if (data?.ip) {
          setDetectedWifiIp(data.ip);
        }
      })
      .catch(() => {});
  }, []);

  if (!isOpen || !batch) return null;

  const handleApplyBaseUrl = (url: string) => {
    const clean = url.trim().replace(/\/+$/, '');
    setCustomBaseUrl(clean);
    if (clean) {
      localStorage.setItem('tp_qr_base_url', clean);
      toast.success(`URL QR diarahkan ke: ${clean}`);
    } else {
      localStorage.removeItem('tp_qr_base_url');
      toast.success('URL QR dikembalikan ke default');
    }
    setShowDomainInput(false);
  };

  const activeQr =
    (savedQrOverride?.batchId === batch.id ? savedQrOverride.qrCode : null) ||
    batch.qrCode ||
    null;
  const effectiveCode = activeQr?.code || batch.publicCode;
  const storedTargetUrl = activeQr?.targetUrl?.trim() || '';
  const isStoredTargetPublic =
    Boolean(storedTargetUrl) &&
    (storedTargetUrl.startsWith('https://') || storedTargetUrl.startsWith('http://')) &&
    !isTemporaryBaseUrl(storedTargetUrl);

  let storedOrigin = '';
  if (isStoredTargetPublic) {
    try {
      storedOrigin = new URL(storedTargetUrl).origin;
    } catch {
      storedOrigin = '';
    }
  }

  const effectiveBaseUrl =
    customBaseUrl ||
    storedOrigin ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  const isLocalhost =
    effectiveBaseUrl.includes('localhost') || effectiveBaseUrl.includes('127.0.0.1');
  const isPrivateIp =
    effectiveBaseUrl.includes('192.168.') ||
    effectiveBaseUrl.includes('10.') ||
    effectiveBaseUrl.includes('172.16.') ||
    effectiveBaseUrl.includes('172.31.');
  const isPublicUrl = !isLocalhost && !isPrivateIp;

  const qrCanonicalUrl = customBaseUrl
    ? buildBatchUrl(effectiveCode, { short: true, baseUrl: customBaseUrl })
    : isStoredTargetPublic
    ? storedTargetUrl
    : buildBatchUrl(effectiveCode, { short: true });
  const fullWebUrl = buildBatchUrl(effectiveCode, {
    short: false,
    baseUrl: customBaseUrl || undefined,
  });

  const organicItems = parseOrganicWasteTypes(batch.organicWasteTypes);

  // Format Gula/Madu (gr jika < 1 kg, kg jika >= 1 kg)
  const molassesDisplay =
    Number(batch.molassesKg) < 1
      ? `${Math.round(Number(batch.molassesKg) * 1000)} gr`
      : `${Number(batch.molassesKg)} kg`;

  const wasteDisplay =
    Number(batch.organicWasteKg) < 1
      ? `${Math.round(Number(batch.organicWasteKg) * 1000)} gr`
      : `${Number(batch.organicWasteKg)} kg`;

  const notifyPrinted = async () => {
    try {
      await ecoEnzymeApi.markQrPrinted(batch.id);
      if (onQrPrinted) onQrPrinted();
    } catch (err) {
      console.error('Gagal memperbarui status cetak QR:', err);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(fullWebUrl);
      setCopied(true);
      toast.success('URL galon berhasil disalin!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin URL');
    }
  };

  const handleDownloadPng = async () => {
    try {
      const canvas = canvasRef.current?.querySelector('canvas');
      if (!canvas) {
        toast.error('Gagal memproses QR canvas');
        return;
      }

      const exportCanvas = document.createElement('canvas');
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return;

      const scale = 2;
      const width = 420;
      const height = 670;
      exportCanvas.width = width * scale;
      exportCanvas.height = height * scale;
      ctx.scale(scale, scale);

      // Background putih
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Border hijau tema Teman Pilah
      ctx.strokeStyle = '#012D1D';
      ctx.lineWidth = 4;
      ctx.strokeRect(12, 12, width - 24, height - 24);

      // Muat logo Teman Pilah (Kiri) dan logo Telkom (Kanan)
      const [tpLogo, telkomLogo] = await Promise.all([
        loadImage('/logo-teman-pilah.png').catch(() => null),
        loadImage('/logo-telkom.png').catch(() => null),
      ]);

      // Gambar Logo Teman Pilah di Kiri
      if (tpLogo) {
        ctx.drawImage(tpLogo, 26, 20, 48, 48);
      }

      // Header branding tengah
      ctx.fillStyle = '#012D1D';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TEMAN PILAH', width / 2, 42);

      ctx.fillStyle = '#2C5F2D';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('ECO ENZYME FERMENTASI', width / 2, 62);

      // Gambar Logo Telkom di Kanan
      if (telkomLogo) {
        const telkomW = 40;
        const telkomH = (telkomLogo.naturalHeight / (telkomLogo.naturalWidth || 1)) * telkomW;
        ctx.drawImage(telkomLogo, width - 26 - telkomW, 18, telkomW, Math.min(telkomH, 50));
      }

      // Garis pemisah
      ctx.strokeStyle = '#D5E3D2';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(26, 78);
      ctx.lineTo(width - 26, 78);
      ctx.stroke();

      // Kode Galon Badge
      const gallonCode = batch.batchCode || effectiveCode;
      ctx.fillStyle = '#EBF4E9';
      ctx.fillRect(40, 90, width - 80, 34);
      ctx.strokeStyle = '#2C5F2D';
      ctx.lineWidth = 1;
      ctx.strokeRect(40, 90, width - 80, 34);

      ctx.fillStyle = '#012D1D';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`KODE: ${gallonCode}`, width / 2, 113);

      // Render QR Code di tengah (170x170 px)
      ctx.drawImage(canvas, (width - 170) / 2, 136, 170, 170);

      // Public code text
      ctx.fillStyle = '#666666';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(effectiveCode, width / 2, 322);

      // Box Detail Bahan & Tanggal
      ctx.fillStyle = '#FAFBF9';
      ctx.fillRect(26, 336, width - 52, 252);
      ctx.strokeStyle = '#CFE1CC';
      ctx.lineWidth = 1;
      ctx.strokeRect(26, 336, width - 52, 252);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#012D1D';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`Wadah : ${batch.containerName}`, 40, 362);

      const startStr = new Date(batch.startDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const harvestStr = new Date(batch.harvestEstimate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#333333';
      ctx.fillText(`Tanggal Buat   : ${startStr}`, 40, 386);
      ctx.fillText(`Tanggal Panen  : ${harvestStr} (90 Hari)`, 40, 408);

      // Garis pemisah dalam box
      ctx.strokeStyle = '#E3E8DC';
      ctx.beginPath();
      ctx.moveTo(40, 422);
      ctx.lineTo(width - 40, 422);
      ctx.stroke();

      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#012D1D';
      ctx.fillText('Bahan :', 40, 442);

      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#222222';
      ctx.fillText(`- Air       = ${Number(batch.waterLiter)} L`, 50, 464);
      ctx.fillText(`- Pemanis = ${molassesDisplay} (Gula/Madu)`, 50, 486);
      ctx.fillText(`- BO (${wasteDisplay}) :`, 50, 508);

      // List BO
      const boList = organicItems.slice(0, 4).join(', ');
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#444444';
      ctx.fillText(`  ${boList}${organicItems.length > 4 ? ', dll.' : ''}`, 55, 528);

      // Footer
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#2C5F2D';
      ctx.fillText('Scan QR Code untuk Cek Progres Hari Panen', width / 2, 615);

      ctx.font = 'italic 9px sans-serif';
      ctx.fillStyle = '#888888';
      ctx.fillText('Komunitas Teman Pilah x Universitas Telkom', width / 2, 635);

      // Unduh File
      const pngUrl = exportCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `label-galon-${batch.batchCode || effectiveCode}.png`;
      link.click();

      toast.success('Label stiker galon PNG berhasil diunduh');
      await notifyPrinted();
    } catch (err) {
      console.error('Download PNG error:', err);
      toast.error('Gagal mengunduh file PNG');
    }
  };

  const handleDownloadSvg = async () => {
    try {
      const svgElement = svgRef.current?.querySelector('svg');
      if (!svgElement) {
        toast.error('Gagal mengambil elemen SVG');
        return;
      }

      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svgElement);

      if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-${batch.batchCode || effectiveCode}.svg`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('QR Code SVG berhasil diunduh');
      await notifyPrinted();
    } catch (err) {
      console.error('Download SVG error:', err);
      toast.error('Gagal mengunduh file SVG');
    }
  };

  const handlePrint = async () => {
    window.print();
    await notifyPrinted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto print:static print:bg-transparent print:p-0">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-stone-200 my-6 max-h-[94vh] overflow-y-auto print:shadow-none print:border-0 print:p-0 print:max-h-none">
        
        {/* Header Modal */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-200 print:hidden">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <QrCode className="w-3.5 h-3.5" /> Barcode & Label Galon
            </div>
            <h3 className="text-xl font-bold text-stone-900 mt-1">
              {batch.containerName}
            </h3>
            <p className="text-xs text-stone-500 font-mono">
              Kode Galon: <strong className="text-emerald-800">{batch.batchCode || effectiveCode}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRINTABLE PHYSICAL GALLON STICKER (Aesthetic community paper note format) */}
        <div className="py-5 flex justify-center">
          <div
            id="printable-gallon-label"
            className="w-[330px] sm:w-[360px] bg-white rounded-2xl border-2 border-[#012D1D] p-5 shadow-md text-center flex flex-col items-center print:border-solid print:border-2 print:border-black print:m-0 print:shadow-none relative"
          >
            {/* BRANDING HEADER WITH LOGOS: TEMAN PILAH (KIRI) & TELKOM (KANAN) */}
            <div className="w-full flex items-center justify-between gap-2 mb-2 px-1">
              {/* Logo Teman Pilah di sebelah kiri */}
              <img
                src="/logo-teman-pilah.png"
                alt="Logo Teman Pilah"
                className="h-11 w-11 object-contain flex-shrink-0"
              />

              {/* Teks Judul di Tengah */}
              <div className="text-center flex-1 min-w-0">
                <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-[#2C5F2D] uppercase block truncate">
                  Teman Pilah
                </span>
                <h4 className="text-xs sm:text-sm font-black text-[#012D1D] tracking-tight leading-tight">
                  ECO ENZYME FERMENTASI
                </h4>
              </div>

              {/* Logo Telkom di sebelah kanan */}
              <img
                src="/logo-telkom.png"
                alt="Logo Universitas Telkom"
                className="h-11 w-auto max-w-[44px] object-contain flex-shrink-0"
              />
            </div>

            {/* KODE GALON BESAR */}
            <div className="mb-2.5 w-full bg-[#EBF4E9] py-1.5 px-3 rounded-lg border border-[#CFE1CC]">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">KODE GALON</span>
              <span className="font-mono text-base font-black text-[#012D1D] tracking-wider">
                {batch.batchCode || effectiveCode}
              </span>
            </div>

            {/* QR CODE DISPLAY */}
            <div className="mb-2">
              <PersistentQrCode
                value={qrCanonicalUrl}
                qrCode={batch.qrCode}
                entityType="ECO_ENZYME_BATCH"
                entityId={batch.id}
                entityKey={batch.batchCode}
                entityName={batch.containerName}
                size={160}
                level="Q"
                marginSize={2}
                canvasWrapperRef={canvasRef}
                svgWrapperRef={svgRef}
                reused={batch.reusedQr}
                onSaved={(savedQr) => {
                  setSavedQrOverride({ batchId: batch.id, qrCode: savedQr });
                  onQrSaved?.(savedQr);
                }}
              />
            </div>

            {/* Tanggal & Bahan (Mirip Catatan Kertas Komunitas Asli) */}
            <div className="w-full bg-[#FAFBF9] p-3.5 rounded-xl border border-[#EDF2E8] text-xs space-y-1.5 mb-2.5 text-left">
              <div className="flex justify-between font-bold text-[#012D1D] pb-1 border-b border-stone-200">
                <span className="text-stone-500 font-normal">Wadah:</span>
                <span className="truncate max-w-[190px] text-right">{batch.containerName}</span>
              </div>
              
              <div className="flex justify-between text-[11px] font-semibold text-stone-700">
                <span className="text-stone-500 font-normal">Tanggal Buat:</span>
                <span>
                  {new Date(batch.startDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className="flex justify-between text-[11px] font-bold text-emerald-900">
                <span className="text-stone-500 font-normal">Tanggal Panen:</span>
                <span>
                  {new Date(batch.harvestEstimate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className="pt-1.5 border-t border-stone-200 space-y-1 text-[11px]">
                <div className="font-bold text-stone-800">Bahan:</div>
                <div className="text-stone-700 pl-2 space-y-0.5">
                  <div>• Air = <strong>{Number(batch.waterLiter)} L</strong></div>
                  <div>• Gula/Madu = <strong>{molassesDisplay}</strong></div>
                  <div>• BO ({wasteDisplay}) :</div>
                  <div className="pl-3 text-stone-600 font-medium">
                    {organicItems.slice(0, 5).map((item, i) => (
                      <span key={i} className="inline-block mr-1.5">
                        {i + 1}. {item}
                      </span>
                    ))}
                    {organicItems.length > 5 && <span>... (+{organicItems.length - 5})</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* TEKS AJAKAN SCAN */}
            <p className="text-[10px] text-[#2C5F2D] font-bold">
              Scan QR untuk cek hari fermentasi &amp; isi lengkap
            </p>
          </div>
        </div>

        {/* BANNER BANTUAN SCAN HP & MODE PUBLIK */}
        <div className="mb-3 print:hidden">
          {isPublicUrl ? (
            <div className="bg-emerald-50/90 border border-emerald-300 rounded-2xl p-3 text-left text-xs flex items-center justify-between">
              <div className="flex items-start gap-2.5 text-emerald-950">
                <div className="p-2 bg-emerald-600 rounded-xl text-white shrink-0 mt-0.5">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-emerald-900 block">
                    Mode Akses Publik Aktif: <code className="font-mono text-[11px] text-emerald-700 font-bold">{effectiveBaseUrl}</code>
                  </span>
                  <span className="text-[11px] text-emerald-800 leading-relaxed block mt-0.5">
                    ✅ Barcode dapat di-scan langsung oleh kamera HP siapa pun <strong>tanpa harus terhubung ke Wi-Fi yang sama</strong>!
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <button
                  type="button"
                  onClick={() => setShowDomainInput(!showDomainInput)}
                  className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-emerald-100 rounded-lg transition"
                  title="Ganti Domain/IP"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyBaseUrl('')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-2 py-1 rounded-lg transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>
            </div>
          ) : isPrivateIp ? (
            <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-2.5 text-left text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-950">
                <div className="p-1.5 bg-amber-100 rounded-lg text-amber-800 shrink-0">
                  <Wifi className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-xs block">
                    Mode Wi-Fi Lokal: <code className="font-mono text-[11px] text-amber-900 font-bold">{effectiveBaseUrl}</code>
                  </span>
                  <span className="text-[10px] text-amber-800 block">
                    Bisa discan jika HP &amp; laptop di 1 Wi-Fi. Ingin scan tanpa 1 Wi-Fi? Klik <strong>Domain Publik</strong>.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDomainInput(!showDomainInput)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-white border border-amber-200 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition"
                  title="Atur Domain Publik / Tunnel"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Domain Publik
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyBaseUrl('')}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 hover:text-stone-800 bg-white border border-stone-200 px-2 py-1 rounded-lg transition"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3 text-left text-xs">
              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 text-xs">
                      Mau Scan Barcode dari Kamera HP?
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDomainInput(!showDomainInput)}
                      className="text-[11px] text-amber-800 hover:text-amber-950 font-bold underline inline-flex items-center gap-1"
                    >
                      <Globe className="w-3 h-3" />
                      Atur Domain Publik (Tanpa 1 Wi-Fi)
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-800/90 leading-relaxed">
                    Kamera HP tidak bisa membuka alamat <code className="bg-amber-200/60 px-1 py-0.5 rounded font-mono text-[10px] text-amber-950">localhost</code> komputer.
                    {detectedWifiIp ? (
                      <> Hubungkan HP ke Wi-Fi yang sama (klik tombol di bawah), atau gunakan <strong>Domain Publik / Tunnel</strong> agar bisa discan dari jaringan internet mana pun.</>
                    ) : (
                      <> Masukkan domain publik atau IP Wi-Fi komputer agar barcode bisa dibuka dari HP.</>
                    )}
                  </p>

                  <div className="pt-1 flex flex-wrap gap-2">
                    {detectedWifiIp && (
                      <button
                        type="button"
                        onClick={() => handleApplyBaseUrl(`http://${detectedWifiIp}:3000`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-[11px] font-bold shadow-xs transition active:scale-95"
                      >
                        <Wifi className="w-3.5 h-3.5" />
                        Gunakan IP Wi-Fi ({detectedWifiIp}:3000)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowDomainInput(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-[11px] font-bold shadow-xs transition active:scale-95"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Atur Domain Publik / Tunnel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form input kustom domain / tunnel jika dibuka */}
          {showDomainInput && (
            <div className="mt-2 p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-left">
              <label className="block text-[11px] font-bold text-stone-700">
                Atur Alamat Base URL Barcode (Publik / Tunnel):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="cth. https://teman-pilah.trycloudflare.com atau https://temanpilah.com"
                  value={domainInputVal}
                  onChange={(e) => setDomainInputVal(e.target.value)}
                  className="flex-1 text-xs bg-white border border-stone-300 rounded-lg px-2.5 py-2 text-stone-800 focus:outline-none focus:border-emerald-700"
                />
                <button
                  type="button"
                  onClick={() => handleApplyBaseUrl(domainInputVal)}
                  className="px-3.5 py-2 bg-[#012D1D] hover:bg-[#0B4A31] text-white text-xs font-bold rounded-lg transition"
                >
                  Terapkan
                </button>
              </div>
              <p className="text-[10px] text-stone-500 leading-relaxed">
                💡 <strong>Tips Akses Publik:</strong> Gunakan URL Cloudflare Tunnel (<code className="bg-stone-200 px-1 py-0.5 rounded text-stone-800">cloudflared</code> / <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-800">untun</code>), Ngrok, atau domain website yang sudah di-hosting di Vercel agar barcode bisa di-scan dari HP mana pun tanpa perlu connect ke 1 Wi-Fi.
              </p>
            </div>
          )}
        </div>

        {/* TOMBOL UTAMA: BUKA DETAIL LENGKAP GALON */}
        <a
          href={fullWebUrl}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 mb-3 rounded-xl bg-[#012D1D] hover:bg-[#0B4A31] text-white font-bold text-xs shadow-md transition-all active:scale-[0.99] print:hidden"
        >
          <span>Buka Detail Lengkap Galon</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {/* URL FIELD */}
        <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 flex items-center justify-between gap-2 text-xs mb-5 print:hidden">
          <span className="font-mono text-[11px] text-stone-600 truncate">
            {fullWebUrl}
          </span>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleCopyUrl}
              className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 transition-colors"
              title="Salin Link"
              type="button"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <a
              href={fullWebUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 transition-colors"
              title="Buka Halaman Galon"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 print:hidden">
          <button
            onClick={handleDownloadPng}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors active:scale-95"
            type="button"
          >
            <Download className="w-4 h-4 text-stone-600" />
            Unduh PNG
          </button>

          <button
            onClick={handleDownloadSvg}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors active:scale-95"
            type="button"
          >
            <Download className="w-4 h-4 text-stone-600" />
            Unduh SVG
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#012D1D] hover:bg-[#0B4A31] text-white text-xs font-bold shadow transition-colors active:scale-95"
            type="button"
          >
            <Printer className="w-4 h-4" />
            Cetak Label
          </button>
        </div>

      </div>
    </div>
  );
}
