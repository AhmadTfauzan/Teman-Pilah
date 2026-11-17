'use client';

import { useState } from 'react';
import { Education } from '@/types';

interface EducationTableProps {
  contents: Education[];
  onEdit: (content: Education) => void;
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

export function EducationTable({ contents, onEdit, onDelete }: EducationTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const totalPages = Math.ceil(contents.length / itemsPerPage) || 1;

  const currentContents = contents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="overflow-hidden rounded-2xl sm:rounded-[24px] border border-[#F0F2EB] bg-white shadow-sm mt-2 sm:mt-6">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-7 border-b border-[#F0F2EB]">
        <h2 className="text-base sm:text-[18px] font-bold text-[#1B361F]">
          Semua Konten
        </h2>
        <p className="text-xs sm:text-[13px] text-[#A1A89A]">
          {contents.length} total item
        </p>
      </div>

      {/* MOBILE 2-COLUMN CARD GRID */}
      <div className="grid grid-cols-2 gap-2.5 p-3 md:hidden">
        {currentContents.map((content) => {
          const isPublished = content.status === 'PUBLISHED';

          return (
            <div
              key={content.id}
              className="flex flex-col justify-between rounded-xl border border-[#E8ECE2] bg-[#FAFBF9] p-2.5 gap-2"
            >
              <div className="space-y-1.5">
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                  isPublished ? 'bg-[#e2f5eb] text-[#166534]' : 'bg-[#fef3c7] text-[#92400e]'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isPublished ? 'bg-[#22C55E]' : 'bg-[#EAB308]'}`} />
                  {isPublished ? 'Terbit' : 'Draft'}
                </span>

                <h3 className="text-xs font-bold text-[#1B361F] leading-snug line-clamp-2">
                  {content.title}
                </h3>

                <p className="text-[10px] text-[#72796E] font-medium">
                  {content.createdAt ? new Date(content.createdAt).toLocaleDateString('id-ID', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : '-'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-1 pt-2 border-t border-[#ECEFE7]">
                <button
                  type="button"
                  onClick={() => onEdit(content)}
                  className="p-1.5 rounded-md text-[#72796E] hover:text-[#2A3426] hover:bg-stone-200/60 transition-colors"
                  title="Edit Konten"
                >
                  <PencilIcon />
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(content.id)}
                  className="p-1.5 rounded-md text-[#72796E] hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Hapus Konten"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          );
        })}

        {contents.length === 0 && (
          <div className="col-span-2 py-12 text-center">
            <p className="text-xs text-[#72796e]">Konten edukasi tidak ditemukan.</p>
          </div>
        )}
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[800px]">
          {/* TABLE HEADER */}
          <div className="flex items-center px-8 py-4 bg-[#F9FAF8] border-b border-[#F0F2EB]">
            <div className="w-[450px] pl-10 text-[13px] font-bold uppercase tracking-wider text-[#A1A89A]">
              JUDUL KONTEN
            </div>
            <div className="w-[300px] text-[13px] font-bold uppercase tracking-wider text-[#A1A89A]">
              TANGGAL
            </div>
            <div className="flex-1 text-right text-[13px] font-bold uppercase tracking-wider text-[#A1A89A]">
              AKSI
            </div>
          </div>

          {/* TABLE ROWS */}
          <div className="divide-y divide-[#F0F2EB]">
            {currentContents.map((content) => {
              return (
                <div
                  key={content.id}
                  className="flex items-center px-8 py-5 hover:bg-gray-50/50 transition-colors group"
                >
                  {/* Title & Dot */}
                  <div className="w-[450px] flex items-center gap-4">
                    <div className={`h-2.5 w-2.5 rounded-full ${content.status === 'PUBLISHED' ? 'bg-[#22C55E]' : 'bg-[#EAB308]'}`} />
                    <span className="text-[14px] font-bold text-[#1B361F] line-clamp-1">
                      {content.title}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="w-[300px]">
                    <span className="text-[13.5px] text-[#72796E]">
                      {content.createdAt ? new Date(content.createdAt).toLocaleDateString('id-ID', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) : '-'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-1 items-center justify-end gap-3">

                    <button
                      type="button"
                      onClick={() => onEdit(content)}
                      className="p-1.5 text-[#72796E] hover:text-[#2A3426] transition-colors"
                    >
                      <PencilIcon />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDelete(content.id)}
                      className="p-1.5 text-[#72796E] hover:text-red-600 transition-colors"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              );
            })}
            
            {contents.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-[#72796e]">Konten edukasi tidak ditemukan.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER PAGINATION */}
      <div className="flex flex-col gap-3 sm:gap-4 border-t border-[#F0F2EB] bg-[#F9FAF8] px-4 sm:px-8 py-3.5 sm:py-5 lg:flex-row lg:items-center lg:justify-between rounded-b-2xl sm:rounded-b-[24px]">
        <div className="flex items-center">
          <p className="text-xs sm:text-[14px] font-medium text-[#72796E]">
            Menampilkan {contents.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, contents.length)} dari {contents.length} konten
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
