'use client';

import { useState } from 'react';
import { QrCode } from 'lucide-react';
import { Product } from '@/types';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onShowQr?: (product: Product) => void;
}

const getCategoryStyles = (category: string) => {
  const cat = category.toUpperCase();
  if (cat.includes('ORGANIC')) {
    return {
      bgClass: 'bg-[#FCE7F3]',
      textClass: 'text-[#EC4899]',
      label: 'Produk Organik',
    };
  }
  if (cat.includes('CRAFT') || cat.includes('UPCYCLED')) {
    return {
      bgClass: 'bg-[#FEEFD8]',
      textClass: 'text-[#D88D54]',
      label: 'Kerajinan',
    };
  }
  if (cat.includes('ZERO_WASTE') || cat.includes('WASTE')) {
    return {
      bgClass: 'bg-[#E2F5EB]',
      textClass: 'text-[#166534]',
      label: 'Zero Waste',
    };
  }

  return {
    bgClass: 'bg-[#F1F5F9]',
    textClass: 'text-[#475569]',
    label: category.replace(/_/g, ' '),
  };
};

const getStockStatusStyles = (stockLabel: Product['stockLabel']) => {
  switch (stockLabel) {
    case 'IN_STOCK':
      return {
        label: 'Tersedia',
        bgClass: 'bg-[#E2F5EB]',
        dotClass: 'bg-[#22C55E]',
        textClass: 'text-[#166534]',
      };
    case 'BULK_AVAILABLE':
      return {
        label: 'Stok Melimpah',
        bgClass: 'bg-[#DBEAFE]',
        dotClass: 'bg-[#2563EB]',
        textClass: 'text-[#1E40AF]',
      };
    case 'OUT_OF_STOCK':
      return {
        label: 'Habis',
        bgClass: 'bg-[#FEE2E2]',
        dotClass: 'bg-[#EF4444]',
        textClass: 'text-[#991B1B]',
      };
    default:
      return {
        label: stockLabel || '-',
        bgClass: 'bg-[#F1F5F9]',
        dotClass: 'bg-[#64748B]',
        textClass: 'text-[#475569]',
      };
  }
};

const PencilIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9"></path>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

export function ProductTable({ products, onEdit, onDelete, onShowQr }: ProductTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(products.length / itemsPerPage) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const currentProducts = products.slice(
    (safePage - 1) * itemsPerPage,
    safePage * itemsPerPage
  );

  return (
    <div className="overflow-hidden rounded-2xl sm:rounded-[24px] border border-[#F0F2EB] bg-white shadow-sm mt-2 sm:mt-6">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-7 border-b border-[#F0F2EB]">
        <h2 className="text-base sm:text-[18px] font-bold text-[#1B361F]">
          Semua Produk
        </h2>
        <p className="text-xs sm:text-[13px] text-[#A1A89A]">
          {products.length} total item
        </p>
      </div>

      {/* MOBILE 2-COLUMN CARD GRID */}
      <div className="grid grid-cols-2 gap-2.5 p-3 md:hidden">
        {currentProducts.map((product) => {
          const catStyles = getCategoryStyles(product.category);
          const stockStyles = getStockStatusStyles(product.stockLabel);

          return (
            <div
              key={product.id}
              className="flex flex-col justify-between rounded-xl border border-[#E8ECE2] bg-[#FAFBF9] p-2.5 gap-2"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-1 flex-wrap">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold leading-tight ${catStyles.bgClass} ${catStyles.textClass}`}>
                    {catStyles.label}
                  </span>
                  {product.productCode && (
                    <span className="font-mono text-[9px] font-semibold text-[#5E6B58] bg-white border border-[#E3E8DC] px-1 py-0.5 rounded truncate max-w-[68px]">
                      {product.productCode}
                    </span>
                  )}
                </div>

                <h3 className="text-xs font-bold text-[#1B361F] leading-snug line-clamp-2">
                  {product.name}
                </h3>

                <div className="space-y-1">
                  <p className="text-xs font-extrabold text-[#27532B]">
                    Rp {Number(product.price || 0).toLocaleString('id-ID')}
                    {product.priceUnit && (
                      <span className="text-[10px] font-medium text-[#72796E] ml-0.5">
                        {product.priceUnit}
                      </span>
                    )}
                  </p>
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="text-[10px] font-semibold text-[#5E6B58]">
                      Stok: {product.stock ?? 0}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${stockStyles.bgClass} ${stockStyles.textClass}`}>
                      <span className={`h-1 w-1 rounded-full ${stockStyles.dotClass}`} />
                      {stockStyles.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-[#ECEFE7]">
                {onShowQr && (
                  <button
                    type="button"
                    onClick={() => onShowQr(product)}
                    className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-[10px] font-bold transition-colors flex-1 min-w-[56px]"
                    title="Lihat & Cetak QR Code Produk"
                  >
                    <QrCode className="w-3 h-3 text-emerald-700 shrink-0" />
                    <span>QR</span>
                  </button>
                )}

                <div className="flex items-center justify-end gap-1 ml-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => onEdit(product)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E3E8DC] bg-white text-[#72796E] hover:text-[#2A3426] hover:bg-stone-100 transition-colors"
                    title="Edit Produk"
                    aria-label={`Edit ${product.name}`}
                  >
                    <PencilIcon />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(product.id)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E3E8DC] bg-white text-[#72796E] hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                    title="Hapus Produk"
                    aria-label={`Hapus ${product.name}`}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {products.length === 0 && (
          <div className="col-span-2 py-12 text-center">
            <p className="text-xs text-[#72796e]">Produk tidak ditemukan.</p>
          </div>
        )}
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[880px] text-left border-collapse">
          <thead>
            <tr className="bg-[#F9FAF8] border-b border-[#F0F2EB]">
              <th className="py-4 pl-10 pr-4 text-[13px] font-bold uppercase tracking-wider text-[#A1A89A]">
                NAMA PRODUK
              </th>
              <th className="py-4 px-4 text-[13px] font-bold uppercase tracking-wider text-[#A1A89A]">
                KATEGORI
              </th>
              <th className="py-4 px-4 text-[13px] font-bold uppercase tracking-wider text-[#A1A89A]">
                HARGA
              </th>
              <th className="py-4 px-4 text-[13px] font-bold uppercase tracking-wider text-[#A1A89A]">
                STOK
              </th>
              <th className="py-4 px-4 text-[13px] font-bold uppercase tracking-wider text-[#A1A89A]">
                STATUS
              </th>
              <th className="py-4 pl-4 pr-8 text-right text-[13px] font-bold uppercase tracking-wider text-[#A1A89A]">
                AKSI
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F0F2EB]">
            {currentProducts.map((product) => {
              const catStyles = getCategoryStyles(product.category);
              const stockStyles = getStockStatusStyles(product.stockLabel);

              return (
                <tr
                  key={product.id}
                  className="hover:bg-gray-50/50 transition-colors group"
                >
                  {/* Title & Dot */}
                  <td className="py-5 pl-8 pr-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${stockStyles.dotClass}`} />
                      <div className="min-w-0">
                        <span className="text-[14px] font-bold text-[#1B361F] line-clamp-1 block">
                          {product.name}
                        </span>
                        {product.productCode && (
                          <span className="inline-block mt-0.5 font-mono text-[10px] font-semibold text-[#5E6B58] bg-[#F3F5F0] border border-[#E3E8DC] px-1.5 py-0.5 rounded">
                            {product.productCode}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-5 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold ${catStyles.bgClass} ${catStyles.textClass}`}>
                      {catStyles.label}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-5 px-4 whitespace-nowrap">
                    <span className="text-[13.5px] font-bold text-[#27532B]">
                      Rp {Number(product.price || 0).toLocaleString('id-ID')}
                    </span>
                    {product.priceUnit && (
                      <span className="text-[11px] text-[#72796E] ml-1">
                        {product.priceUnit}
                      </span>
                    )}
                  </td>

                  {/* Stock */}
                  <td className="py-5 px-4 whitespace-nowrap">
                    <span className="text-[13.5px] font-semibold text-[#1B361F]">
                      {product.stock ?? 0}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-5 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${stockStyles.bgClass} ${stockStyles.textClass}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${stockStyles.dotClass}`} />
                      {stockStyles.label}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-5 pl-4 pr-8 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-2">
                      {onShowQr && (
                        <button
                          type="button"
                          onClick={() => onShowQr(product)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold transition-colors"
                          title="Lihat & Cetak QR Code Produk"
                        >
                          <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                          <span>QR</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        className="p-1.5 text-[#72796E] hover:text-[#2A3426] transition-colors"
                        title="Edit Produk"
                      >
                        <PencilIcon />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(product.id)}
                        className="p-1.5 text-[#72796E] hover:text-red-600 transition-colors"
                        title="Hapus Produk"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <p className="text-[#72796e]">Produk tidak ditemukan.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER PAGINATION */}
      <div className="flex flex-col gap-3 sm:gap-4 border-t border-[#F0F2EB] bg-[#F9FAF8] px-4 sm:px-8 py-3.5 sm:py-5 lg:flex-row lg:items-center lg:justify-between rounded-b-2xl sm:rounded-b-[24px]">
        <div className="flex items-center">
          <p className="text-xs sm:text-[14px] font-medium text-[#72796E]">
            {products.length === 0
              ? 'Menampilkan 0 dari 0 produk'
              : `Menampilkan ${(safePage - 1) * itemsPerPage + 1}-${Math.min(safePage * itemsPerPage, products.length)} dari ${products.length} produk`}
          </p>
        </div>

        <nav aria-label="Pagination" className="inline-flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* PREV */}
          <button
            type="button"
            onClick={() => setCurrentPage(Math.max(safePage - 1, 1))}
            disabled={safePage === 1}
            className={`flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white transition-colors ${
              safePage === 1 ? 'text-[#9CA3AF] cursor-not-allowed opacity-50' : 'text-[#4B5563] hover:bg-gray-50'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>

          {/* PAGE NUMBERS */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`flex h-[34px] w-[34px] items-center justify-center rounded-[10px] text-[13px] font-bold transition-colors ${
                safePage === page
                  ? 'bg-[#154212] text-white border border-[#154212]'
                  : 'border border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}

          {/* NEXT */}
          <button
            type="button"
            onClick={() => setCurrentPage(Math.min(safePage + 1, totalPages))}
            disabled={safePage === totalPages}
            className={`flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white transition-colors ${
              safePage === totalPages ? 'text-[#9CA3AF] cursor-not-allowed opacity-50' : 'text-[#4B5563] hover:bg-gray-50'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </nav>
      </div>
    </div>
  );
}
