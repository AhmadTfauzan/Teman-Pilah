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

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
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
      const height = 520;
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
      ctx.fillText('TEMAN PILAH', width / 2, 40);

      ctx.fillStyle = '#2C5F2D';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('KATALOG PRODUK DAUR ULANG', width / 2, 58);

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
      ctx.fillText(
        `KODE: ${product.productCode || effectiveCode}`,
        width / 2,
        107
      );

      ctx.drawImage(canvas, (width - 180) / 2, 134, 180, 180);

      ctx.fillStyle = '#666666';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`QR ID: ${effectiveCode}`, width / 2, 330);

      ctx.fillStyle = '#FAFBF9';
      ctx.fillRect(26, 346, width - 52, 108);
      ctx.strokeStyle = '#CFE1CC';
      ctx.lineWidth = 1;
      ctx.strokeRect(26, 346, width - 52, 108);

      ctx.fillStyle = '#012D1D';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(truncateText(product.name, 30), width / 2, 376);

      ctx.fillStyle = '#2C5F2D';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(getCategoryLabel(product.category), width / 2, 400);

      ctx.fillStyle = '#111111';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(formattedPrice, width / 2, 432);

      ctx.fillStyle = '#2C5F2D';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('Scan QR untuk detail & pemesanan produk', width / 2, 480);

      ctx.fillStyle = '#888888';
      ctx.font = 'italic 9px sans-serif';
      ctx.fillText('Komunitas Bank Sampah Teman Pilah', width / 2, 498);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto print:static print:bg-transparent print:p-0">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-stone-200 my-6 max-h-[94vh] overflow-y-auto print:shadow-none print:border-0 print:p-0 print:max-h-none">
        {/* Header Modal */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-200 print:hidden">
          <div className="min-w-0 pr-3">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <QrCode className="w-3.5 h-3.5" /> QR Code Produk Permanen
            </div>
            <h3 className="text-xl font-bold text-stone-900 mt-1.5 truncate">
              {product.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-stone-500 font-mono">
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
        <div className="py-5 flex justify-center">
          <div className="w-[320px] sm:w-[350px] bg-white rounded-2xl border-2 border-[#012D1D] p-5 shadow-md text-center flex flex-col items-center print:border-solid print:border-2 print:border-black print:m-0 print:shadow-none">
            <div className="w-full flex items-center justify-between gap-2 mb-2.5 px-1">
              <img
                src="/logo-teman-pilah.png"
                alt="Logo Teman Pilah"
                className="h-10 w-10 object-contain shrink-0"
              />
              <div className="text-center flex-1 min-w-0">
                <span className="text-[10px] font-black tracking-widest text-[#2C5F2D] uppercase block truncate">
                  Teman Pilah
                </span>
                <h4 className="text-xs sm:text-sm font-black text-[#012D1D] tracking-tight leading-tight">
                  PRODUK DAUR ULANG
                </h4>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4 text-[#012D1D]" />
              </div>
            </div>

            <div className="mb-3 w-full bg-[#EBF4E9] py-1.5 px-3 rounded-lg border border-[#CFE1CC]">
              <span className="text-[10px] uppercase font-bold text-stone-500 block">
                KODE QR PRODUK
              </span>
              <span className="font-mono text-sm font-black text-[#012D1D] tracking-wider">
                {effectiveCode}
              </span>
              {product.productCode && product.productCode !== effectiveCode && (
                <span className="block font-mono text-[10px] text-emerald-800 mt-0.5">
                  SKU: {product.productCode}
                </span>
              )}
            </div>

            <div className="mb-3">
              <PersistentQrCode
                value={qrCanonicalUrl}
                qrCode={product.qrCode}
                entityType="PRODUCT"
                entityId={product.id}
                entityKey={product.productCode ?? null}
                entityName={product.name}
                size={168}
                level="Q"
                marginSize={2}
                canvasWrapperRef={canvasRef}
                svgWrapperRef={svgRef}
                reused={Boolean(product.qrCode?.qrDataUrl)}
                onSaved={(savedQr) => {
                  setSavedQrOverride({ productId: product.id, qrCode: savedQr });
                  onQrSaved?.(savedQr);
                }}
              />
            </div>

            <div className="w-full bg-[#FAFBF9] p-3 rounded-xl border border-[#EDF2E8] text-center space-y-1 mb-2.5">
              <p className="text-sm font-bold text-[#012D1D] leading-snug">
                {product.name}
              </p>
              <p className="text-[11px] font-semibold text-[#2C5F2D]">
                {getCategoryLabel(product.category)}
              </p>
              <p className="text-sm font-black text-stone-900">
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
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 mb-3 rounded-xl bg-[#012D1D] hover:bg-[#0B4A31] text-white font-bold text-xs shadow-md transition-all active:scale-[0.99] print:hidden"
        >
          <span>Buka Halaman Detail Produk</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* Copyable URL Field */}
        <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 flex items-center justify-between gap-2 text-xs mb-5 print:hidden">
          <span className="font-mono text-[11px] text-stone-600 truncate">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 print:hidden">
          <button
            type="button"
            onClick={handleDownloadPng}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors active:scale-95"
          >
            <Download className="w-4 h-4 text-stone-600" />
            Unduh PNG
          </button>

          <button
            type="button"
            onClick={handleDownloadSvg}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition-colors active:scale-95"
          >
            <Download className="w-4 h-4 text-stone-600" />
            Unduh SVG
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#012D1D] hover:bg-[#0B4A31] text-white text-xs font-bold shadow transition-colors active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Cetak Label
          </button>
        </div>
      </div>
    </div>
  );
}
