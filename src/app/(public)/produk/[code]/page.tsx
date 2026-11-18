import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  Package,
  QrCode,
  ShoppingBag,
  Sparkles,
  Tag,
  XCircle,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { SafeImage } from '@/components/shared/SafeImage';
import { OutlineLeaf, ConcentricCircles } from '@/components/ui/DecorativeElements';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ code: string }>;
}

const DEFAULT_WHATSAPP = '6281234567890';

function decodeIdentifier(rawCode: string): string {
  try {
    return decodeURIComponent(rawCode).trim();
  } catch {
    return rawCode.trim();
  }
}

async function findProductByCode(rawCode: string) {
  const identifier = decodeIdentifier(rawCode);
  if (!identifier) return null;

  const normalized = identifier.toUpperCase();

  // 1) Prioritas utama: kecocokan tepat productCode (case-insensitive)
  const byProductCode = await prisma.product.findFirst({
    where: { productCode: { equals: normalized, mode: 'insensitive' } },
    include: { qrCode: true },
  });
  if (byProductCode) return byProductCode;

  // 2) Prioritas kedua: kecocokan tepat qrCode.code pada relasi produk
  const byQrRelation = await prisma.product.findFirst({
    where: { qrCode: { code: { equals: normalized, mode: 'insensitive' } } },
    include: { qrCode: true },
    orderBy: { createdAt: 'desc' },
  });
  if (byQrRelation) return byQrRelation;

  // 3) Prioritas ketiga: kecocokan tepat ID produk
  const byId = await prisma.product.findUnique({
    where: { id: identifier },
    include: { qrCode: true },
  });
  if (byId) return byId;

  // 4) Fallback via registry QrCode jika relasi qrCodeId pada produk belum terpasang
  const qrRecord = await prisma.qrCode.findFirst({
    where: {
      entityType: 'PRODUCT',
      code: { equals: normalized, mode: 'insensitive' },
    },
  });
  if (qrRecord) {
    if (qrRecord.primaryKey) {
      const byQrPrimaryKey = await prisma.product.findFirst({
        where: { productCode: { equals: qrRecord.primaryKey, mode: 'insensitive' } },
        include: { qrCode: true },
      });
      if (byQrPrimaryKey) {
        return { ...byQrPrimaryKey, qrCode: byQrPrimaryKey.qrCode ?? qrRecord };
      }
    } else if (qrRecord.primaryName) {
      const byQrPrimaryName = await prisma.product.findFirst({
        where: { name: { equals: qrRecord.primaryName, mode: 'insensitive' } },
        include: { qrCode: true },
        orderBy: { createdAt: 'desc' },
      });
      if (byQrPrimaryName) {
        return { ...byQrPrimaryName, qrCode: byQrPrimaryName.qrCode ?? qrRecord };
      }
    }
  }

  // 5) Fallback terakhir: kecocokan nama produk secara eksplisit
  return prisma.product.findFirst({
    where: { name: { equals: identifier, mode: 'insensitive' } },
    include: { qrCode: true },
    orderBy: { createdAt: 'desc' },
  });
}

function resolveProductImageSrc(image?: string | null): string | null {
  if (!image || !image.trim()) return null;
  const trimmed = image.trim();
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }
  return `/${trimmed.replace(/^\/+/, '')}`;
}

function getCategoryMeta(category: string) {
  switch (category) {
    case 'ORGANIC':
      return {
        label: 'Produk Organik',
        badgeClass: 'bg-[#FCE7F3] text-[#BE185D] border-[#FBCFE8]',
      };
    case 'UPCYCLED_GOODS':
      return {
        label: 'Kerajinan Daur Ulang',
        badgeClass: 'bg-[#FEEFD8] text-[#B45309] border-[#FDE68A]',
      };
    case 'ZERO_WASTE':
      return {
        label: 'Zero Waste',
        badgeClass: 'bg-[#E2F5EB] text-[#166534] border-[#BBF7D0]',
      };
    default:
      return {
        label: category.replace(/_/g, ' '),
        badgeClass: 'bg-stone-100 text-stone-700 border-stone-200',
      };
  }
}

function getStockMeta(stockLabel: string, stock: number) {
  switch (stockLabel) {
    case 'BULK_AVAILABLE':
      return {
        label: `Stok Grosir Tersedia${stock > 0 ? ` (${stock} unit)` : ''}`,
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        isAvailable: true,
      };
    case 'OUT_OF_STOCK':
      return {
        label: 'Stok Sedang Habis',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        isAvailable: false,
      };
    case 'IN_STOCK':
    default:
      return {
        label: `Tersedia${stock > 0 ? ` (${stock} unit)` : ''}`,
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        isAvailable: true,
      };
  }
}

function buildWhatsappHref(
  whatsappLink: string | null | undefined,
  productName: string,
  productCode: string
): string {
  const defaultMsg = encodeURIComponent(
    `Halo Teman Pilah, saya tertarik memesan produk ${productName} (${productCode}).`
  );
  if (!whatsappLink || !whatsappLink.trim()) {
    return `https://wa.me/${DEFAULT_WHATSAPP}?text=${defaultMsg}`;
  }
  const trimmed = whatsappLink.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  let digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('08')) {
    digits = `62${digits.slice(1)}`;
  }
  return `https://wa.me/${digits || DEFAULT_WHATSAPP}?text=${defaultMsg}`;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { code } = await params;
  const product = await findProductByCode(code);

  if (!product) {
    return {
      title: 'Produk Tidak Ditemukan | Teman Pilah',
      description: 'Detail produk daur ulang Teman Pilah tidak ditemukan.',
    };
  }

  const priceText = `Rp ${Number(product.price).toLocaleString('id-ID')}${
    product.priceUnit ? ` ${product.priceUnit}` : ''
  }`;
  const title = `${product.name} (${product.productCode}) | Teman Pilah`;
  const description =
    product.description ||
    `Produk daur ulang komunitas Teman Pilah — ${product.name} (${priceText}).`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

export default async function PublicProductDetailPage({ params }: PageProps) {
  const { code } = await params;
  const product = await findProductByCode(code);

  if (!product) {
    notFound();
  }

  const imageSrc = resolveProductImageSrc(product.image);
  const categoryMeta = getCategoryMeta(product.category);
  const stockMeta = getStockMeta(product.stockLabel, product.stock);
  const formattedPrice = `Rp ${Number(product.price).toLocaleString('id-ID')}`;
  const whatsappHref = buildWhatsappHref(
    product.whatsappLink,
    product.name,
    product.productCode
  );
  const qrCodeValue = product.qrCode?.code || product.productCode;

  return (
    <div className="min-h-screen bg-[#F8F6F1] pt-20 pb-12 sm:pt-24 sm:pb-20 px-3 sm:px-6 relative overflow-hidden">
      <div className="absolute -right-24 top-28 opacity-20 pointer-events-none rotate-[20deg]">
        <OutlineLeaf size={340} color="#203220" strokeWidth={6.72} />
      </div>
      <div className="absolute -left-20 bottom-24 opacity-25 pointer-events-none">
        <ConcentricCircles size={300} color="#FC9634" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10 space-y-4 sm:space-y-6">
        <div>
          <Link
            href="/#katalog"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#4A5546] hover:text-[#012D1D] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Katalog Produk</span>
          </Link>
        </div>

        <article className="bg-white rounded-2xl sm:rounded-3xl border border-[#E3E8DC] shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Product Image */}
            <div className="bg-[#FAFBF9] border-b md:border-b-0 md:border-r border-[#E3E8DC] flex items-center justify-center p-4 sm:p-8 min-h-[210px] sm:min-h-[340px] md:min-h-[380px]">
              {imageSrc ? (
                <div className="w-full h-full max-h-[260px] sm:max-h-[380px] rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-stone-200 shadow-xs flex items-center justify-center">
                  <SafeImage
                    src={imageSrc}
                    fallbackSrc="/activity/Pengmas (11).jpeg"
                    alt={product.name}
                    className="w-full h-full object-cover max-h-[260px] sm:max-h-[380px]"
                  />
                </div>
              ) : (
                <div className="w-full h-44 sm:h-72 rounded-xl sm:rounded-2xl border-2 border-dashed border-[#D5E3D2] bg-white flex flex-col items-center justify-center text-stone-400 gap-2">
                  <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-700/40" />
                  <span className="text-xs font-medium">
                    Foto produk belum tersedia
                  </span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-4 sm:p-8 flex flex-col justify-between gap-4 sm:gap-6">
              <div className="space-y-3 sm:space-y-4">
                {/* Category & Code Badges */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold border ${categoryMeta.badgeClass}`}
                  >
                    <Tag className="w-3 h-3" />
                    {categoryMeta.label}
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-bold bg-[#EBF4E9] text-[#012D1D] border border-[#CFE1CC]">
                    <Package className="w-3 h-3" />
                    {product.productCode}
                  </span>

                  {qrCodeValue && qrCodeValue !== product.productCode && (
                    <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                      <QrCode className="w-3 h-3" />
                      {qrCodeValue}
                    </span>
                  )}
                </div>

                {/* Product Name */}
                <h1 className="text-xl sm:text-3xl font-black text-[#012D1D] leading-tight">
                  {product.name}
                </h1>

                {/* Price + Unit */}
                <div className="flex items-baseline gap-1.5 bg-[#FAFBF9] border border-[#EDF2E8] rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3">
                  <span className="text-xl sm:text-3xl font-black text-[#012D1D]">
                    {formattedPrice}
                  </span>
                  {product.priceUnit && (
                    <span className="text-xs sm:text-sm font-semibold text-stone-500">
                      {product.priceUnit}
                    </span>
                  )}
                </div>

                {/* Stock Status */}
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold border ${stockMeta.badgeClass}`}
                  >
                    {stockMeta.isAvailable ? (
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                    {stockMeta.label}
                  </span>
                </div>

                {/* Description */}
                <div className="pt-2 border-t border-stone-100">
                  <h2 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-stone-400 mb-1 sm:mb-1.5">
                    Deskripsi Produk
                  </h2>
                  <p className="text-xs sm:text-sm text-[#42493E] leading-relaxed whitespace-pre-line">
                    {product.description ||
                      'Produk ramah lingkungan hasil karya komunitas Bank Sampah Teman Pilah.'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2.5 sm:space-y-3 pt-1 sm:pt-2">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#012D1D] hover:bg-[#0B4A31] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.99]"
                >
                  <MessageCircle className="w-4 h-4 text-[#80E478]" />
                  <span>
                    {stockMeta.isAvailable
                      ? 'Pesan via WhatsApp'
                      : 'Tanyakan Stok via WhatsApp'}
                  </span>
                </a>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] text-stone-500 px-1">
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-700" />
                    Produk Resmi Komunitas Teman Pilah
                  </span>
                  <Link
                    href="/#katalog"
                    className="font-bold text-[#012D1D] hover:underline"
                  >
                    Lihat Produk Lain
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
