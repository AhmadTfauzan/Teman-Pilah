'use client';

import { useState } from 'react';
import { Gallery } from '@/types';
import { getGalleryImageUrl } from '@/lib/api/gallery';

interface GalleryTableProps {
  items: Gallery[];
  onEdit: (item: Gallery) => void;
  onDelete: (id: string) => void;
}

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

export function GalleryTable({ items, onEdit, onDelete }: GalleryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(items.length / itemsPerPage) || 1;

  const currentItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="overflow-hidden rounded-2xl sm:rounded-[24px] border border-[#F0F2EB] bg-white shadow-sm mt-2 sm:mt-6">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-7 border-b border-[#F0F2EB]">
        <h2 className="text-base sm:text-[18px] font-bold text-[#1B361F]">
          Semua Item Galeri
        </h2>
        <p className="text-xs sm:text-[13px] text-[#A1A89A]">
          {items.length} total item
        </p>
      </div>

      {/* MOBILE 2-COLUMN CARD GRID */}
      <div className="grid grid-cols-2 gap-2.5 p-3 md:hidden">
        {currentItems.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-xl border border-[#E8ECE2] bg-[#FAFBF9] overflow-hidden"
          >
            <div className="h-24 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
              {item.image ? (
                <img
                  src={getGalleryImageUrl(item.image)}
                  alt={item.title || 'Gallery'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[10px] text-gray-400">Tidak ada Foto</span>
              )}
            </div>

            <div className="p-2.5 flex flex-col flex-1 justify-between gap-2">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-[#2A3426] leading-snug line-clamp-2">
                  {item.title || <span className="text-gray-400 italic font-normal">Tanpa judul</span>}
                </h3>
                {item.description && (
                  <p className="text-[10px] text-[#72796E] line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-[#ECEFE7]">
                <span className="text-[9px] text-[#72796E] truncate">
                  {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: '2-digit'
                  }) : '-'}
                </span>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="p-1.5 rounded-md text-[#72796E] hover:text-[#2A3426] hover:bg-stone-200/60 transition-colors"
                    title="Edit Item"
                  >
                    <PencilIcon />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="p-1.5 rounded-md text-[#72796E] hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Hapus Item"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="col-span-2 py-12 text-center">
            <p className="text-xs text-[#72796e]">Item galeri tidak ditemukan.</p>
          </div>
        )}
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[800px]">
          {/* TABLE HEADER */}
          <div className="flex items-center px-8 py-4 bg-[#F9FAF8] border-b border-[#F0F2EB]">
            <div className="w-[100px] pl-6 text-[13px] font-bold uppercase tracking-wider text-[#A1A89A]">
              FOTO
            </div>
            <div className="w-[280px] text-[13px] font-bold uppercase tracking-wider text-[#A1A89A]">
              JUDUL
            </div>
            <div className="w-[340px] text-[13px] font-bold uppercase tracking-wider text-[#A1A89A]">
              DESKRIPSI
            </div>
            <div className="w-[160px] text-[13px] font-bold uppercase tracking-wider text-[#A1A89A]">
              TANGGAL DIBUAT
            </div>
            <div className="flex-1 text-right text-[13px] font-bold uppercase tracking-wider text-[#A1A89A]">
              AKSI
            </div>
          </div>

          {/* TABLE ROWS */}
          <div className="divide-y divide-[#F0F2EB]">
            {currentItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center px-8 py-5 hover:bg-gray-50/50 transition-colors group"
              >
                {/* Image Thumbnail */}
                <div className="w-[100px] pl-6">
                  <div className="h-16 w-16 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                    {item.image ? (
                      <img 
                        src={getGalleryImageUrl(item.image)} 
                        alt={item.title || "Gallery"} 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <span className="text-[10px] text-gray-400">Tidak ada Foto</span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div className="w-[280px] pr-4">
                  <span className="text-[14px] text-[#2A3426] font-semibold line-clamp-2">
                    {item.title || <span className="text-gray-400 italic font-normal">Tanpa judul</span>}
                  </span>
                </div>

                {/* Description */}
                <div className="w-[340px] pr-6">
                  <span className="text-[13px] text-[#72796E] font-medium line-clamp-2">
                    {item.description || <span className="text-gray-400 italic">Tidak ada deskripsi</span>}
                  </span>
                </div>

                {/* Created Date */}
                <div className="w-[160px]">
                  <span className="text-[13px] text-[#72796E] font-medium">
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) : '-'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-1 items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="p-1.5 text-[#72796E] hover:text-[#2A3426] transition-colors"
                  >
                    <PencilIcon />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="p-1.5 text-[#72796E] hover:text-red-600 transition-colors"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
            
            {items.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-[#72796e]">Item galeri tidak ditemukan.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER PAGINATION */}
      {items.length > 0 && (
        <div className="flex flex-col gap-3 sm:gap-4 border-t border-[#F0F2EB] bg-[#F9FAF8] px-4 sm:px-8 py-3.5 sm:py-5 lg:flex-row lg:items-center lg:justify-between rounded-b-2xl sm:rounded-b-[24px]">
          <div className="flex items-center">
            <p className="text-xs sm:text-[14px] font-medium text-[#72796E]">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, items.length)} dari {items.length} item galeri
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
      )}
    </div>
  );
}
