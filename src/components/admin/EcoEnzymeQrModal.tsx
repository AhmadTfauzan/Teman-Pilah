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
  Smartphone,
  Wifi,
  Globe,
  Settings,
  RotateCcw,
} from 'lucide-react';
import { EcoEnzymeBatch, QrCodeRecord } from '@/types';
import { getSiteUrl } from '@/lib/api-config';
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
  isPublicView?: boolean;
}

function getHostnameSafe(rawUrl: string): string {
  if (!rawUrl) return '';
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function isLocalhostUrl(rawUrl: string): boolean {
  const host = getHostnameSafe(rawUrl);
  return (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '[::1]'
  );
}

function isPrivateIp(rawUrl: string): boolean {
  const host = getHostnameSafe(rawUrl);
  if (!host) return false;
  if (isLocalhostUrl(rawUrl)) return true;

  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!match) return false;
  const octets = match.slice(1).map((part) => Number(part));
  if (octets.some((o) => !Number.isInteger(o) || o < 0 || o > 255)) {
    return false;
  }

  const [a, b] = octets;
  if (a === 10) return true; // RFC 1918 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC 1918 172.16.0.0/12
  if (a === 192 && b === 168) return true; // RFC 1918 192.168.0.0/16
  if (a === 127) return true; // Loopback 127.0.0.0/8
  return false;
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

function truncateCanvasLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  const ellipsis = '...';
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(`${truncated}${ellipsis}`).width > maxWidth) {
    truncated = truncated.slice(0, -1).trimEnd();
  }
  return truncated ? `${truncated}${ellipsis}` : ellipsis;
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number = 2
): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized || maxLines <= 0) return [];
  if (maxLines === 1) {
    return [truncateCanvasLine(ctx, normalized, maxWidth)];
  }

  const words = normalized.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    let word = words[i];

    if (!currentLine) {
      while (ctx.measureText(word).width > maxWidth) {
        if (lines.length >= maxLines - 1) {
          lines.push(truncateCanvasLine(ctx, word, maxWidth));
          return lines;
        }
        let cut = word.length - 1;
        while (cut > 1 && ctx.measureText(word.slice(0, cut)).width > maxWidth) {
          cut--;
        }
        lines.push(word.slice(0, cut));
        word = word.slice(cut);
      }
      currentLine = word;
      continue;
    }

    const candidate = `${currentLine} ${word}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
    } else if (lines.length < maxLines - 1) {
      lines.push(currentLine);
      currentLine = '';
      i--;
    } else {
      lines.push(truncateCanvasLine(ctx, `${currentLine}...`, maxWidth));
      return lines;
    }
  }

  if (currentLine) {
    lines.push(truncateCanvasLine(ctx, currentLine, maxWidth));
  }

  return lines;
}

export function EcoEnzymeQrModal({
  isOpen,
  onClose,
  batch,
  onQrPrinted,
  onQrSaved,
  isPublicView = false,
}: EcoEnzymeQrModalProps) {
  if (!isOpen || !batch) return null;

  return (
    <EcoEnzymeQrModalContent
      key={batch.id}
      batch={batch}
      onClose={onClose}
      onQrPrinted={onQrPrinted}
      onQrSaved={onQrSaved}
      isPublicView={isPublicView}
    />
  );
}

function EcoEnzymeQrModalContent({
  batch,
  onClose,
  onQrPrinted,
  onQrSaved,
  isPublicView = false,
}: {
  batch: EcoEnzymeBatch;
  onClose: () => void;
  onQrPrinted?: () => void;
  onQrSaved?: (qr: QrCodeRecord) => void;
  isPublicView?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [savedQrOverride, setSavedQrOverride] = useState<{
    batchId: string;
    qrCode: QrCodeRecord;
  } | null>(null);
  const [customBaseUrl, setCustomBaseUrl] = useState<string>(() => {
    if (!isPublicView && typeof window !== 'undefined') {
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
    if (isPublicView) return;
    let cancelled = false;
    fetch('/api/network-ip')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.ip) {
          setDetectedWifiIp(data.ip);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isPublicView]);

  const handleApplyBaseUrl = (url: string) => {
    const trimmed = url.trim().replace(/\/+$/, '');
    if (!trimmed) {
      setCustomBaseUrl('');
      localStorage.removeItem('tp_qr_base_url');
      toast.success('URL QR dikembalikan ke default');
      setDomainInputVal('');
      setShowDomainInput(false);
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      toast.error('URL tidak valid. Contoh: https://teman-pilah.trycloudflare.com');
      return;
    }

    if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || !parsed.hostname) {
      toast.error('URL harus diawali http:// atau https:// dengan domain/IP yang valid.');
      return;
    }

    const cleanOrigin = parsed.origin;
    setCustomBaseUrl(cleanOrigin);
    localStorage.setItem('tp_qr_base_url', cleanOrigin);
    toast.success(`URL QR diarahkan ke: ${cleanOrigin}`);
    setDomainInputVal('');
    setShowDomainInput(false);
  };

  const effectiveCustomBaseUrl = isPublicView ? '' : customBaseUrl;
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
    effectiveCustomBaseUrl ||
    storedOrigin ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  const isLocalhost = isLocalhostUrl(effectiveBaseUrl);
  const isPrivateNetwork = !isLocalhost && isPrivateIp(effectiveBaseUrl);
  const isPublicUrl = !isLocalhost && !isPrivateIp(effectiveBaseUrl);

  const publicBaseUrl = storedOrigin || getSiteUrl();
  const qrCanonicalUrl = effectiveCustomBaseUrl
    ? buildBatchUrl(effectiveCode, { short: true, baseUrl: effectiveCustomBaseUrl })
    : isStoredTargetPublic
    ? storedTargetUrl
    : buildBatchUrl(effectiveCode, {
        short: true,
        baseUrl: isPublicView ? publicBaseUrl : undefined,
      });
  const fullWebUrl = buildBatchUrl(effectiveCode, {
    short: false,
    baseUrl: isPublicView ? publicBaseUrl : effectiveCustomBaseUrl || undefined,
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
    if (isPublicView) return;
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
      const boxX = 26;
      const boxWidth = width - boxX * 2;
      const boxInnerWidth = width - 80;
      const boMaxWidth = width - 95;
      const gallonCode = batch.batchCode || effectiveCode;

      ctx.font = 'bold 16px monospace';
      const gallonBadgeText =
        wrapCanvasText(ctx, `KODE: ${gallonCode}`, width - 104, 1)[0] ||
        `KODE: ${gallonCode}`;

      ctx.font = 'bold 10px monospace';
      const publicCodeText =
        wrapCanvasText(ctx, effectiveCode, width - 80, 1)[0] || effectiveCode;

      ctx.font = 'bold 13px sans-serif';
      const containerLines = wrapCanvasText(
        ctx,
        `Wadah : ${batch.containerName}`,
        boxInnerWidth,
        2
      );

      ctx.font = '11px sans-serif';
      const boLines = wrapCanvasText(
        ctx,
        organicItems.join(', '),
        boMaxWidth,
        3
      );

      const boxY = 336;
      const wadahStartY = 360;
      const afterWadahY = wadahStartY + Math.max(0, containerLines.length - 1) * 17;
      const startDateY = afterWadahY + 24;
      const harvestDateY = startDateY + 22;
      const sepY = harvestDateY + 14;
      const bahanTitleY = sepY + 20;
      const airY = bahanTitleY + 22;
      const pemanisY = airY + 22;
      const boHeaderY = pemanisY + 22;
      const boListStartY = boHeaderY + 20;
      const afterBoY = boListStartY + Math.max(0, boLines.length - 1) * 15;
      const boxHeight = Math.max(252, afterBoY - boxY + 22);
      const footerY1 = boxY + boxHeight + 27;
      const footerY2 = footerY1 + 20;
      const height = Math.max(670, footerY2 + 35);

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
      ctx.fillText('TEMAN PILAH', width / 2, 42, 240);

      ctx.fillStyle = '#2C5F2D';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('ECO ENZYME FERMENTASI', width / 2, 62, 240);

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
      ctx.fillStyle = '#EBF4E9';
      ctx.fillRect(40, 90, width - 80, 34);
      ctx.strokeStyle = '#2C5F2D';
      ctx.lineWidth = 1;
      ctx.strokeRect(40, 90, width - 80, 34);

      ctx.fillStyle = '#012D1D';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(gallonBadgeText, width / 2, 113, width - 104);

      // Render QR Code di tengah (170x170 px)
      ctx.drawImage(canvas, (width - 170) / 2, 136, 170, 170);

      // Public code text
      ctx.fillStyle = '#666666';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(publicCodeText, width / 2, 322, width - 80);

      // Box Detail Bahan & Tanggal
      ctx.fillStyle = '#FAFBF9';
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      ctx.strokeStyle = '#CFE1CC';
      ctx.lineWidth = 1;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#012D1D';
      ctx.font = 'bold 13px sans-serif';
      containerLines.forEach((line, idx) => {
        ctx.fillText(line, 40, wadahStartY + idx * 17, boxInnerWidth);
      });

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
      ctx.fillText(`Tanggal Buat   : ${startStr}`, 40, startDateY, boxInnerWidth);
      ctx.fillText(`Tanggal Panen  : ${harvestStr} (90 Hari)`, 40, harvestDateY, boxInnerWidth);

      // Garis pemisah dalam box
      ctx.strokeStyle = '#E3E8DC';
      ctx.beginPath();
      ctx.moveTo(40, sepY);
      ctx.lineTo(width - 40, sepY);
      ctx.stroke();

      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#012D1D';
      ctx.fillText('Bahan :', 40, bahanTitleY, boxInnerWidth);

      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#222222';
      ctx.fillText(`- Air       = ${Number(batch.waterLiter)} L`, 50, airY, boMaxWidth);
      ctx.fillText(`- Pemanis = ${molassesDisplay} (Gula/Madu)`, 50, pemanisY, boMaxWidth);
      ctx.fillText(`- BO (${wasteDisplay}) :`, 50, boHeaderY, boMaxWidth);

      // List BO
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#444444';
      boLines.forEach((line, idx) => {
        ctx.fillText(line, 55, boListStartY + idx * 15, boMaxWidth);
      });

      // Footer
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#2C5F2D';
      ctx.fillText('Scan QR Code untuk Cek Progres Hari Panen', width / 2, footerY1, width - 52);

      ctx.font = 'italic 9px sans-serif';
      ctx.fillStyle = '#888888';
      ctx.fillText('Komunitas Teman Pilah x Universitas Telkom', width / 2, footerY2, width - 52);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto print:static print:bg-transparent print:p-0">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-8 shadow-2xl border border-stone-200 my-2 sm:my-6 max-h-[94vh] overflow-y-auto print:shadow-none print:border-0 print:p-0 print:max-h-none">
        
        {/* Header Modal */}
        <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-stone-200 print:hidden">
          <div className="min-w-0 pr-2">
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 sm:px-2.5 py-0.5 rounded-full border border-emerald-200">
              <QrCode className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Barcode &amp; Label Galon
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-stone-900 mt-1 truncate">
              {batch.containerName}
            </h3>
            <p className="text-[11px] sm:text-xs text-stone-500 font-mono">
              Kode Galon: <strong className="text-emerald-800">{batch.batchCode || effectiveCode}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRINTABLE PHYSICAL GALLON STICKER (Aesthetic community paper note format) */}
        <div className="py-3 sm:py-5 flex justify-center">
          <div
            id="printable-gallon-label"
            className="w-full max-w-[320px] sm:w-[360px] sm:max-w-none bg-white rounded-2xl border-2 border-[#012D1D] p-3.5 sm:p-5 shadow-md text-center flex flex-col items-center print:border-solid print:border-2 print:border-black print:m-0 print:shadow-none relative"
          >
            {/* BRANDING HEADER WITH LOGOS: TEMAN PILAH (KIRI) & TELKOM (KANAN) */}
            <div className="w-full flex items-center justify-between gap-2 mb-2 px-0.5 sm:px-1">
              {/* Logo Teman Pilah di sebelah kiri */}
              <img
                src="/logo-teman-pilah.png"
                alt="Logo Teman Pilah"
                className="h-9 w-9 sm:h-11 sm:w-11 object-contain flex-shrink-0"
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
                className="h-9 sm:h-11 w-auto max-w-[38px] sm:max-w-[44px] object-contain flex-shrink-0"
              />
            </div>

            {/* KODE GALON BESAR */}
            <div className="mb-2 w-full bg-[#EBF4E9] py-1 sm:py-1.5 px-2.5 sm:px-3 rounded-lg border border-[#CFE1CC]">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-stone-500 block">KODE GALON</span>
              <span className="font-mono text-sm sm:text-base font-black text-[#012D1D] tracking-wider">
                {batch.batchCode || effectiveCode}
              </span>
            </div>

            {/* QR CODE DISPLAY */}
            <div className="mb-2">
              <PersistentQrCode
                value={qrCanonicalUrl}
                qrCode={activeQr}
                entityType="ECO_ENZYME_BATCH"
                entityId={batch.id}
                entityKey={batch.batchCode}
                entityName={batch.containerName}
                size={150}
                level="Q"
                marginSize={2}
                canvasWrapperRef={canvasRef}
                svgWrapperRef={svgRef}
                reused={batch.reusedQr}
                showStatusBadge={!isPublicView}
                isPublicView={isPublicView}
                onSaved={(savedQr) => {
                  setSavedQrOverride({ batchId: batch.id, qrCode: savedQr });
                  onQrSaved?.(savedQr);
                }}
              />
            </div>

            {/* Tanggal & Bahan (Mirip Catatan Kertas Komunitas Asli) */}
            <div className="w-full bg-[#FAFBF9] p-2.5 sm:p-3.5 rounded-xl border border-[#EDF2E8] text-xs space-y-1 sm:space-y-1.5 mb-2 text-left">
              <div className="flex justify-between font-bold text-[#012D1D] pb-1 border-b border-stone-200">
                <span className="text-stone-500 font-normal">Wadah:</span>
                <span className="truncate max-w-[175px] sm:max-w-[190px] text-right">{batch.containerName}</span>
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

              <div className="pt-1 sm:pt-1.5 border-t border-stone-200 space-y-0.5 sm:space-y-1 text-[11px]">
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
        {!isPublicView && (
        <div className="mb-2.5 sm:mb-3 print:hidden">
          {isPublicUrl ? (
            <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-left text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-start gap-2 text-emerald-950 min-w-0">
                <div className="p-1.5 sm:p-2 bg-emerald-600 rounded-lg sm:rounded-xl text-white shrink-0 mt-0.5">
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-[11px] sm:text-xs text-emerald-900 block break-all">
                    Mode Akses Publik Aktif: <code className="font-mono text-[10px] sm:text-[11px] text-emerald-700 font-bold">{effectiveBaseUrl}</code>
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-emerald-800 leading-relaxed block mt-0.5">
                    ✅ Barcode dapat di-scan langsung oleh kamera HP siapa pun <strong>tanpa harus terhubung ke Wi-Fi yang sama</strong>!
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
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
          ) : isPrivateNetwork ? (
            <div className="bg-amber-50/90 border border-amber-200 rounded-xl sm:rounded-2xl p-2.5 text-left text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-950 min-w-0">
                <div className="p-1.5 bg-amber-100 rounded-lg text-amber-800 shrink-0">
                  <Wifi className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-[11px] sm:text-xs block break-all">
                    Mode Wi-Fi Lokal: <code className="font-mono text-[10px] sm:text-[11px] text-amber-900 font-bold">{effectiveBaseUrl}</code>
                  </span>
                  <span className="text-[10px] text-amber-800 block">
                    Bisa discan jika HP &amp; laptop di 1 Wi-Fi. Ingin scan tanpa 1 Wi-Fi? Klik <strong>Domain Publik</strong>.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
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
            <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-left text-xs">
              <div className="flex items-start gap-2">
                <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg sm:rounded-xl text-amber-800 shrink-0">
                  <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-bold text-amber-900 text-[11px] sm:text-xs">
                      Mau Scan Barcode dari Kamera HP?
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDomainInput(!showDomainInput)}
                      className="text-[10px] sm:text-[11px] text-amber-800 hover:text-amber-950 font-bold underline inline-flex items-center gap-1"
                    >
                      <Globe className="w-3 h-3" />
                      Atur Domain Publik
                    </button>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-amber-800/90 leading-relaxed">
                    Kamera HP tidak bisa membuka alamat <code className="bg-amber-200/60 px-1 py-0.5 rounded font-mono text-[10px] text-amber-950">localhost</code> komputer.
                    {detectedWifiIp ? (
                      <> Hubungkan HP ke Wi-Fi yang sama, atau gunakan <strong>Domain Publik / Tunnel</strong> agar bisa discan dari jaringan mana pun.</>
                    ) : (
                      <> Masukkan domain publik atau IP Wi-Fi komputer agar barcode bisa dibuka dari HP.</>
                    )}
                  </p>

                  <div className="pt-0.5 sm:pt-1 flex flex-wrap gap-1.5 sm:gap-2">
                    {detectedWifiIp && (
                      <button
                        type="button"
                        onClick={() => handleApplyBaseUrl(`http://${detectedWifiIp}:3000`)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold shadow-xs transition active:scale-95"
                      >
                        <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        IP Wi-Fi ({detectedWifiIp}:3000)
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowDomainInput(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] font-bold shadow-xs transition active:scale-95"
                    >
                      <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      Domain Publik / Tunnel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form input kustom domain / tunnel jika dibuka */}
          {showDomainInput && (
            <div className="mt-2 p-2.5 sm:p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-left">
              <label className="block text-[11px] font-bold text-stone-700">
                Atur Alamat Base URL Barcode (Publik / Tunnel):
              </label>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <input
                  type="text"
                  placeholder="cth. https://teman-pilah.trycloudflare.com"
                  value={domainInputVal}
                  onChange={(e) => setDomainInputVal(e.target.value)}
                  className="flex-1 min-w-0 text-xs bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 sm:py-2 text-stone-800 focus:outline-none focus:border-emerald-700"
                />
                <button
                  type="button"
                  onClick={() => handleApplyBaseUrl(domainInputVal)}
                  className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#012D1D] hover:bg-[#0B4A31] text-white text-xs font-bold rounded-lg transition shrink-0"
                >
                  Terapkan
                </button>
              </div>
              <p className="text-[10px] text-stone-500 leading-relaxed">
                💡 <strong>Tips Akses Publik:</strong> Gunakan URL Cloudflare Tunnel (<code className="bg-stone-200 px-1 py-0.5 rounded text-stone-800">cloudflared</code> / <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-800">untun</code>), Ngrok, atau domain website yang sudah di-hosting di Vercel.
              </p>
            </div>
          )}
        </div>
        )}

        {/* TOMBOL UTAMA: BUKA DETAIL LENGKAP GALON */}
        <a
          href={fullWebUrl}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 mb-2.5 sm:mb-3 rounded-xl bg-[#012D1D] hover:bg-[#0B4A31] text-white font-bold text-xs shadow-md transition-all active:scale-[0.99] print:hidden"
        >
          <span>Buka Detail Lengkap Galon</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {/* URL FIELD */}
        <div className="bg-stone-50 p-2 sm:p-2.5 rounded-xl border border-stone-200 flex items-center justify-between gap-2 text-xs mb-3 sm:mb-5 print:hidden">
          <span className="font-mono text-[10px] sm:text-[11px] text-stone-600 truncate">
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
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 print:hidden">
          <button
            onClick={handleDownloadPng}
            className="inline-flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] sm:text-xs font-bold transition-colors active:scale-95"
            type="button"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-600 shrink-0" />
            <span className="sm:hidden">PNG</span>
            <span className="hidden sm:inline">Unduh PNG</span>
          </button>

          <button
            onClick={handleDownloadSvg}
            className="inline-flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] sm:text-xs font-bold transition-colors active:scale-95"
            type="button"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-600 shrink-0" />
            <span className="sm:hidden">SVG</span>
            <span className="hidden sm:inline">Unduh SVG</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-[#012D1D] hover:bg-[#0B4A31] text-white text-[11px] sm:text-xs font-bold shadow transition-colors active:scale-95"
            type="button"
          >
            <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="sm:hidden">Cetak</span>
            <span className="hidden sm:inline">Cetak Label</span>
          </button>
        </div>

      </div>
    </div>
  );
}
