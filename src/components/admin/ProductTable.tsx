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
      label: 'Produk Organik'
    };
  } else if (cat.includes('CRAFT') || cat.includes('UPCYCLED')) {
    return {
      bgClass: 'bg-[#FEEFD8]',
      textClass: 'text-[#D88D54]',
      label: 'Kerajinan'
    };
  } else if (cat.includes('ZERO_WASTE') || cat.includes('WASTE')) {
    return {
      bgClass: 'bg-[#E2F5EB]',
      textClass: 'text-[#166534]',
      label: 'Zero Waste'
    };
  }
  
  return {
    bgClass: 'bg-[#F1F5F9]',
    textClass: 'text-[#475569]',
    label: category.replace(/_/g, ' ')
  };
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

  // Reset page when products change
  // Actually, we can use a quick effect or just rely on parent resetting it, but let's keep it simple.
  
  const currentProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Format category to title case
  const formatCategory = (cat: string) => {
    return cat.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  };

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

                <p className="text-xs font-extrabold text-[#27532B]">
                  Rp {Number(product.price || 0).toLocaleString('id-ID')}
                </p>
              </div>

              <div className="flex items-center justify-between gap-1 pt-2 border-t border-[#ECEFE7]">
                {onShowQr && (
                  <button
                    type="button"
                    onClick={() => onShowQr(product)}
                    className="inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-[10px] font-bold transition-colors flex-1"
                    title="Lihat & Cetak QR Code Produk"
                  >
                    <QrCode className="w-3 h-3 text-emerald-700" />
                    <span>QR</span>
                  </button>
                )}

                <div className="flex items-center gap-0.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => onEdit(product)}
                    className="p-1.5 rounded-md text-[#72796E] hover:text-[#2A3426] hover:bg-stone-200/60 transition-colors"
                    title="Edit Produk"
                  >
                    <PencilIcon />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(product.id)}
                    className="p-1.5 rounded-md text-[#72796E] hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Hapus Produk"
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
        <div className="min-w-[800px]">
          {/* TABLE HEADER */}
          <div className="flex items-center px-8 py-4 bg-[#F9FAF8] border-b border-[#F0F2EB]">
            <div className="w-[350px] pl-10 text-[13px] font-bold uppercase tracking-wider text-[#A1A89A]">
              NAMA PRODUK
            </div>
            <div className="w-[300px] text-[13px] font-bold uppercase tracking-wider text-[#A1A89A]">
              KATEGORI
            </div>
            <div className="flex-1 text-right text-[13px] font-bold uppercase tracking-wider text-[#A1A89A]">
              AKSI
            </div>
          </div>

          {/* TABLE ROWS */}
          <div className="divide-y divide-[#F0F2EB]">
            {currentProducts.map((product) => {
              const catStyles = getCategoryStyles(product.category);

              return (
                <div
                  key={product.id}
                  className="flex items-center px-8 py-5 hover:bg-gray-50/50 transition-colors group"
                >
                  {/* Title & Dot */}
                  <div className="w-[350px] flex items-center gap-4">
                    <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#22C55E]" />
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

                  {/* Category */}
                  <div className="w-[300px]">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold ${catStyles.bgClass} ${catStyles.textClass}`}>
                      {catStyles.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-1 items-center justify-end gap-3">
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
                    >
                      <PencilIcon />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(product.id)}
                      className="p-1.5 text-[#72796E] hover:text-red-600 transition-colors"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              );
            })}
            
            {products.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-[#72796e]">Produk tidak ditemukan.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER PAGINATION */}
      <div className="flex flex-col gap-3 sm:gap-4 border-t border-[#F0F2EB] bg-[#F9FAF8] px-4 sm:px-8 py-3.5 sm:py-5 lg:flex-row lg:items-center lg:justify-between rounded-b-2xl sm:rounded-b-[24px]">
        <div className="flex items-center">
          <p className="text-xs sm:text-[14px] font-medium text-[#72796E]">
            Menampilkan {products.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, products.length)} dari {products.length} produk
          </p>
        </div>

        <nav aria-label="Pagination" className="inline-flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* PREV */}
          <button
            type="button"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white transition-colors ${
              currentPage === 1 ? 'text-[#9CA3AF] cursor-not-allowed opacity-50' : 'text-[#4B5563] hover:bg-gray-50'
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
                currentPage === page
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
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-[#E5E7EB] bg-white transition-colors ${
              currentPage === totalPages ? 'text-[#9CA3AF] cursor-not-allowed opacity-50' : 'text-[#4B5563] hover:bg-gray-50'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </nav>
      </div>
    </div>
  );
}
