'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Printer,
  QrCode,
  Tag,
  X,
} from 'lucide-react';
import { Product, QrCodeRecord } from '@/types';
import { getSiteUrl } from '@/lib/api-config';
import { isTemporaryBaseUrl, normalizeBatchCode } from '@/lib/batch-url';
import { PersistentQrCode } from '@/components/shared/PersistentQrCode';
import { toast } from 'sonner';

interface ProductQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
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

function getCategoryLabel(category: Product['category']): string {
  switch (category) {
    case 'ORGANIC':
      return 'Produk Organik';
    case 'UPCYCLED_GOODS':
      return 'Kerajinan Daur Ulang';
    case 'ZERO_WASTE':
      return 'Zero Waste';
    default:
      return String(category).replace(/_/g, ' ');
  }
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

export function ProductQrModal({
  isOpen,
  onClose,
  product,
  onQrSaved,
}: ProductQrModalProps) {
  const [copied, setCopied] = useState(false);
  const [savedQrOverride, setSavedQrOverride] = useState<{
    productId: string;
    qrCode: QrCodeRecord;
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !product) return null;

  const activeQr =
    (savedQrOverride?.productId === product.id ? savedQrOverride.qrCode : null) ||
    product.qrCode ||
    null;
  const effectiveCode =
    activeQr?.code ||
    (product.productCode ? normalizeBatchCode(product.productCode) : product.id);

  const savedCustomBase =
    typeof window !== 'undefined'
      ? (localStorage.getItem('tp_qr_base_url') || '').trim().replace(/\/+$/, '')
      : '';

  const storedTargetUrl = activeQr?.targetUrl?.trim() || '';
  const isStoredTargetPublic =
    Boolean(storedTargetUrl) &&
    (storedTargetUrl.startsWith('https://') ||
      storedTargetUrl.startsWith('http://')) &&
    !isTemporaryBaseUrl(storedTargetUrl);

  const baseSiteUrl = (savedCustomBase || getSiteUrl()).replace(/\/+$/, '');
  const encodedCode = encodeURIComponent(effectiveCode);

  const qrCanonicalUrl = savedCustomBase
    ? `${savedCustomBase}/p/${encodedCode}`
    : isStoredTargetPublic
    ? storedTargetUrl
    : `${baseSiteUrl}/p/${encodedCode}`;

  const detailPath = `/produk/${encodedCode}`;
  const fullWebUrl = `${baseSiteUrl}${detailPath}`;
  const formattedPrice = `Rp ${Number(product.price || 0).toLocaleString('id-ID')}${
    product.priceUnit ? ` ${product.priceUnit}` : ''
  }`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(fullWebUrl);
      setCopied(true);
      toast.success('URL produk berhasil disalin!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin URL produk');
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
      const width = 400;
      const badgeMaxWidth = width - 96;
      const boxMaxTextWidth = width - 84;
      const rawCodeLabel = `KODE: ${product.productCode || effectiveCode}`;

      ctx.font = 'bold 14px monospace';
      const codeBadgeText =
        wrapCanvasText(ctx, rawCodeLabel, badgeMaxWidth, 1)[0] || rawCodeLabel;

      ctx.font = 'bold 10px monospace';
      const qrIdText =
        wrapCanvasText(ctx, `QR ID: ${effectiveCode}`, width - 60, 1)[0] ||
        `QR ID: ${effectiveCode}`;

      ctx.font = 'bold 15px sans-serif';
      const nameLines = wrapCanvasText(ctx, product.name, boxMaxTextWidth, 2);

      ctx.font = 'bold 11px sans-serif';
      const categoryLabel = getCategoryLabel(product.category);
      const categoryText =
        wrapCanvasText(ctx, categoryLabel, boxMaxTextWidth, 1)[0] || categoryLabel;

      ctx.font = 'bold 16px sans-serif';
      const priceLines = wrapCanvasText(ctx, formattedPrice, boxMaxTextWidth, 2);

      const boxY = 346;
      const nameStartY = nameLines.length > 1 ? 370 : 376;
      const afterNameY = nameStartY + Math.max(0, nameLines.length - 1) * 18;
      const categoryY = afterNameY + 24;
      const priceStartY = categoryY + 28;
      const afterPriceY = priceStartY + Math.max(0, priceLines.length - 1) * 20;
      const boxHeight = Math.max(108, afterPriceY - boxY + 22);
      const footerY1 = boxY + boxHeight + 26;
      const footerY2 = footerY1 + 18;
      const height = Math.max(520, footerY2 + 22);

      exportCanvas.width = width * scale;
      exportCanvas.height = height * scale;
      ctx.scale(scale, scale);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = '#012D1D';
      ctx.lineWidth = 4;
      ctx.strokeRect(12, 12, width - 24, height - 24);

      const tpLogo = await loadImage('/logo-teman-pilah.png').catch(() => null);
      if (tpLogo) {
        ctx.drawImage(tpLogo, 26, 22, 42, 42);
      }

      ctx.fillStyle = '#012D1D';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('TEMAN PILAH', width / 2, 40, 230);

      ctx.fillStyle = '#2C5F2D';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('KATALOG PRODUK DAUR ULANG', width / 2, 58, 230);

      ctx.strokeStyle = '#D5E3D2';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(26, 74);
      ctx.lineTo(width - 26, 74);
      ctx.stroke();

      ctx.fillStyle = '#EBF4E9';
      ctx.fillRect(36, 86, width - 72, 32);
      ctx.strokeStyle = '#2C5F2D';
      ctx.lineWidth = 1;
      ctx.strokeRect(36, 86, width - 72, 32);

      ctx.fillStyle = '#012D1D';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(codeBadgeText, width / 2, 107, badgeMaxWidth);

      ctx.drawImage(canvas, (width - 180) / 2, 134, 180, 180);

      ctx.fillStyle = '#666666';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(qrIdText, width / 2, 330, width - 60);

      ctx.fillStyle = '#FAFBF9';
      ctx.fillRect(26, boxY, width - 52, boxHeight);
      ctx.strokeStyle = '#CFE1CC';
      ctx.lineWidth = 1;
      ctx.strokeRect(26, boxY, width - 52, boxHeight);

      ctx.fillStyle = '#012D1D';
      ctx.font = 'bold 15px sans-serif';
      nameLines.forEach((line, idx) => {
        ctx.fillText(line, width / 2, nameStartY + idx * 18, boxMaxTextWidth);
      });

      ctx.fillStyle = '#2C5F2D';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(categoryText, width / 2, categoryY, boxMaxTextWidth);

      ctx.fillStyle = '#111111';
      ctx.font = 'bold 16px sans-serif';
      priceLines.forEach((line, idx) => {
        ctx.fillText(line, width / 2, priceStartY + idx * 20, boxMaxTextWidth);
      });

      ctx.fillStyle = '#2C5F2D';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('Scan QR untuk detail & pemesanan produk', width / 2, footerY1, width - 48);

      ctx.fillStyle = '#888888';
      ctx.font = 'italic 9px sans-serif';
      ctx.fillText('Komunitas Bank Sampah Teman Pilah', width / 2, footerY2, width - 48);

      const pngUrl = exportCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `qr-produk-${product.productCode || effectiveCode}.png`;
      link.click();

      toast.success('Label QR produk PNG berhasil diunduh');
    } catch (err) {
      console.error('Download product QR PNG error:', err);
      toast.error('Gagal mengunduh file PNG');
    }
  };

  const handleDownloadSvg = () => {
    try {
      const svgElement = svgRef.current?.querySelector('svg');
      if (!svgElement) {
        toast.error('Gagal mengambil elemen SVG');
        return;
      }

      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svgElement);

      if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(
          /^<svg/,
          '<svg xmlns="http://www.w3.org/2000/svg"'
        );
      }

      const svgBlob = new Blob([source], {
        type: 'image/svg+xml;charset=utf-8',
      });
      const url = URL.createObjectURL(svgBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-produk-${product.productCode || effectiveCode}.svg`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('QR Code produk SVG berhasil diunduh');
    } catch (err) {
      console.error('Download product QR SVG error:', err);
      toast.error('Gagal mengunduh file SVG');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto print:static print:bg-transparent print:p-0">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-8 shadow-2xl border border-stone-200 my-2 sm:my-6 max-h-[94vh] overflow-y-auto print:shadow-none print:border-0 print:p-0 print:max-h-none">
        {/* Header Modal */}
        <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-stone-200 print:hidden">
          <div className="min-w-0 pr-2 sm:pr-3">
            <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 sm:px-2.5 py-0.5 rounded-full border border-emerald-200">
              <QrCode className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> QR Code Produk Permanen
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-stone-900 mt-1 sm:mt-1.5 truncate">
              {product.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] sm:text-xs text-stone-500 font-mono">
              {product.productCode && (
                <span>
                  Kode Produk:{' '}
                  <strong className="text-emerald-800">
                    {product.productCode}
                  </strong>
                </span>
              )}
              <span>
                QR ID:{' '}
                <strong className="text-stone-800">{effectiveCode}</strong>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors shrink-0"
            aria-label="Tutup modal QR"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Label Preview */}
        <div className="py-3 sm:py-5 flex justify-center">
          <div
            id="printable-gallon-label"
            className="w-full max-w-[320px] sm:w-[350px] sm:max-w-none bg-white rounded-2xl border-2 border-[#012D1D] p-3.5 sm:p-5 shadow-md text-center flex flex-col items-center print:border-solid print:border-2 print:border-black print:m-0 print:shadow-none"
          >
            <div className="w-full flex items-center justify-between gap-2 mb-2 sm:mb-2.5 px-0.5 sm:px-1">
              <img
                src="/logo-teman-pilah.png"
                alt="Logo Teman Pilah"
                className="h-9 w-9 sm:h-10 sm:w-10 object-contain shrink-0"
              />
              <div className="text-center flex-1 min-w-0">
                <span className="text-[10px] font-black tracking-widest text-[#2C5F2D] uppercase block truncate">
                  Teman Pilah
                </span>
                <h4 className="text-xs sm:text-sm font-black text-[#012D1D] tracking-tight leading-tight">
                  PRODUK DAUR ULANG
                </h4>
              </div>
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4 text-[#012D1D]" />
              </div>
            </div>

            <div className="mb-2 sm:mb-3 w-full bg-[#EBF4E9] py-1 sm:py-1.5 px-2.5 sm:px-3 rounded-lg border border-[#CFE1CC]">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-stone-500 block">
                KODE QR PRODUK
              </span>
              <span className="font-mono text-xs sm:text-sm font-black text-[#012D1D] tracking-wider">
                {effectiveCode}
              </span>
              {product.productCode && product.productCode !== effectiveCode && (
                <span className="block font-mono text-[10px] text-emerald-800 mt-0.5">
                  SKU: {product.productCode}
                </span>
              )}
            </div>

            <div className="mb-2 sm:mb-3">
              <PersistentQrCode
                value={qrCanonicalUrl}
                qrCode={activeQr}
                entityType="PRODUCT"
                entityId={product.id}
                entityKey={product.productCode ?? null}
                entityName={product.name}
                size={156}
                level="Q"
                marginSize={2}
                canvasWrapperRef={canvasRef}
                svgWrapperRef={svgRef}
                reused={Boolean(activeQr?.id)}
                onSaved={(savedQr) => {
                  setSavedQrOverride({ productId: product.id, qrCode: savedQr });
                  onQrSaved?.(savedQr);
                }}
              />
            </div>

            <div className="w-full bg-[#FAFBF9] p-2.5 sm:p-3 rounded-xl border border-[#EDF2E8] text-center space-y-0.5 sm:space-y-1 mb-2">
              <p className="text-xs sm:text-sm font-bold text-[#012D1D] leading-snug">
                {product.name}
              </p>
              <p className="text-[11px] font-semibold text-[#2C5F2D]">
                {getCategoryLabel(product.category)}
              </p>
              <p className="text-xs sm:text-sm font-black text-stone-900">
                {formattedPrice}
              </p>
            </div>

            <p className="text-[10px] text-[#2C5F2D] font-bold">
              Scan QR untuk detail produk &amp; pemesanan
            </p>
          </div>
        </div>

        {/* Open Public Product Page CTA */}
        <Link
          href={detailPath}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 mb-2.5 sm:mb-3 rounded-xl bg-[#012D1D] hover:bg-[#0B4A31] text-white font-bold text-xs shadow-md transition-all active:scale-[0.99] print:hidden"
        >
          <span>Buka Halaman Detail Produk</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* Copyable URL Field */}
        <div className="bg-stone-50 p-2 sm:p-2.5 rounded-xl border border-stone-200 flex items-center justify-between gap-2 text-xs mb-3 sm:mb-5 print:hidden">
          <span className="font-mono text-[10px] sm:text-[11px] text-stone-600 truncate">
            {fullWebUrl}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleCopyUrl}
              className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 transition-colors"
              title="Salin Link Produk"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <Link
              href={detailPath}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-700 transition-colors"
              title="Buka Halaman Produk"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 print:hidden">
          <button
            type="button"
            onClick={handleDownloadPng}
            className="inline-flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] sm:text-xs font-bold transition-colors active:scale-95"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-600 shrink-0" />
            <span className="sm:hidden">PNG</span>
            <span className="hidden sm:inline">Unduh PNG</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadSvg}
            className="inline-flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-[11px] sm:text-xs font-bold transition-colors active:scale-95"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-600 shrink-0" />
            <span className="sm:hidden">SVG</span>
            <span className="hidden sm:inline">Unduh SVG</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-[#012D1D] hover:bg-[#0B4A31] text-white text-[11px] sm:text-xs font-bold shadow transition-colors active:scale-95"
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
