'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { EducationTable } from '@/components/admin/EducationTable';
import { EducationModal, EducationModalSubmitData } from '@/components/admin/EducationModal';
import { SuccessModal } from '@/components/admin/SuccessModal';
import { DeleteModal } from '@/components/admin/DeleteModal';
import { toast } from 'sonner';
import { Education } from '@/types';
import { educationApi } from '@/lib/api/education';

const SearchIcon = () => (
  <svg
    aria-hidden="true"
    className="h-[15px] w-[15px]"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.9375 10.9375L14 14"
      stroke="#72796E"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="6.5625"
      cy="6.5625"
      r="5.5625"
      stroke="#72796E"
      strokeWidth="1.4"
    />
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    aria-hidden="true"
    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 6L8 10L12 6"
      stroke="#72796E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SortIcon = () => (
  <svg
    aria-hidden="true"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7 4V16"
      stroke="#42493E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.5 6.5L7 4L9.5 6.5"
      stroke="#42493E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13 16V4"
      stroke="#42493E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10.5 13.5L13 16L15.5 13.5"
      stroke="#42493E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function AdminEducationPage() {
  const [contents, setContents] = useState<Education[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('newest');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContent, setEditingContent] = useState<Education | null>(null);

  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({ isOpen: false, id: '', name: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchContents = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const data = await educationApi.getAll();
      setContents(data);
    } catch (error) {
      console.error('Fetch education error:', error);
      toast.error('Gagal memuat konten edukasi');
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await educationApi.getAll();
        if (!cancelled) {
          setContents(data);
        }
      } catch (error) {
        console.error('Fetch education error:', error);
        if (!cancelled) {
          toast.error('Gagal memuat konten edukasi');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredContents = useMemo(() => {
    let result = [...contents];

    if (searchTerm) {
      result = result.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }

    // Client-side sorting
    if (dateFilter === 'newest') {
      result.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
    } else if (dateFilter === 'oldest') {
      result.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeA - timeB;
      });
    } else if (dateFilter === 'title-asc') {
      result.sort((a, b) =>
        a.title.localeCompare(b.title, 'id-ID', { sensitivity: 'base' })
      );
    }

    return result;
  }, [contents, searchTerm, statusFilter, dateFilter]);

  const handleCycleSort = () => {
    setDateFilter((prev) => (prev === 'title-asc' ? 'newest' : 'title-asc'));
  };

  const sortLabel =
    dateFilter === 'title-asc'
      ? 'Urutkan: Judul A-Z'
      : dateFilter === 'oldest'
      ? 'Urutkan: Terlama'
      : 'Urutkan: Terbaru';

  const handleEdit = (content: Education) => {
    setEditingContent(content);
    setIsModalOpen(true);
  };

  const handleOpenNewModal = () => {
    setEditingContent(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: EducationModalSubmitData) => {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('slug', data.slug);
      formData.append('overview', data.overview || '');
      formData.append('description', data.description || '');
      if (data.publishDate) {
        formData.append('publishDate', data.publishDate);
      }
      if (data.tags && data.tags.length > 0) {
        formData.append('tags', data.tags.join(','));
      }
      formData.append('status', data.status);

      if (data.imageFile) {
        formData.append('thumbnail', data.imageFile);
      }

      const isEditing = Boolean(editingContent);

      if (editingContent) {
        await educationApi.update(editingContent.id, formData);
      } else {
        await educationApi.create(formData);
      }

      setIsModalOpen(false);
      setEditingContent(null);
      setSuccessModal({
        isOpen: true,
        title: isEditing ? 'Berhasil Memperbarui' : 'Berhasil Menambahkan',
        message: isEditing
          ? 'Konten edukasi berhasil diperbarui.'
          : 'Konten edukasi berhasil ditambahkan.'
      });
      await fetchContents(true);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan konten edukasi');
      throw error;
    }
  };

  const handleDeleteClick = (id: string) => {
    const content = contents.find(c => c.id === id);
    setDeleteModal({
      isOpen: true,
      id,
      name: content?.title || 'this content'
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id || isDeleting) return;
    const targetId = deleteModal.id;
    const nameToDelete = deleteModal.name;
    setIsDeleting(true);
    try {
      await educationApi.delete(targetId, nameToDelete);
      setDeleteModal({ isOpen: false, id: '', name: '' });
      setSuccessModal({
        isOpen: true,
        title: 'Berhasil Menghapus',
        message: 'Konten edukasi berhasil dihapus.'
      });
      await fetchContents(true);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus konten edukasi');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#154212]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-8">
      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-3 sm:gap-5">
        <div>
          <h1 className="font-serif text-2xl sm:text-[32px] font-bold leading-tight sm:leading-[38.4px] text-[#2A3426] tracking-tight">
            Konten Edukasi
          </h1>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="inline-flex items-center gap-2 rounded-lg bg-[#27532B] px-3.5 py-2 sm:px-5 sm:py-2.5 hover:brightness-110 transition-all text-white font-medium text-xs sm:text-[13px]"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Tambah Konten</span>
        </button>
      </header>

      {/* FILTER SECTION */}
      <div className="rounded-2xl sm:rounded-[20px] border border-[#F0F2EB] bg-white p-2 sm:p-2.5 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          {/* SEARCH */}
          <div className="relative flex-1">
            <label className="sr-only" htmlFor="content-search">
              Cari konten
            </label>
            <div className="flex h-10 sm:h-11 items-center rounded-xl sm:rounded-[14px] bg-[#F9FAF8] pl-9 sm:pl-10 pr-4">
              <input
                id="content-search"
                placeholder="Cari berdasarkan judul..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoComplete="off"
                className="w-full border-none bg-transparent text-xs sm:text-[13px] text-[#42493e] outline-none placeholder:text-[#A1A89A]"
              />
            </div>
            <div className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 opacity-50">
              <SearchIcon />
            </div>
          </div>

          {/* FILTERS */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row">
            <div className="relative w-full sm:w-[140px]">
              <select
                className="h-9 sm:h-11 w-full appearance-none rounded-xl sm:rounded-[14px] bg-[#F9FAF8] border border-[#F0F2EB] px-3 sm:px-4 pr-8 sm:pr-10 text-xs sm:text-[13px] font-medium text-[#72796E] outline-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Status: Semua</option>
                <option value="PUBLISHED">Diterbitkan</option>
                <option value="DRAFT">Draft</option>
              </select>
              <ChevronDownIcon />
            </div>

            <div className="relative w-full sm:w-[165px]">
              <select
                className="h-9 sm:h-11 w-full appearance-none rounded-xl sm:rounded-[14px] bg-[#F9FAF8] border border-[#F0F2EB] px-3 sm:px-4 pr-8 sm:pr-10 text-xs sm:text-[13px] font-medium text-[#72796E] outline-none cursor-pointer"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="newest">Tanggal: Terbaru</option>
                <option value="oldest">Tanggal: Terlama</option>
                <option value="title-asc">Judul: A-Z</option>
              </select>
              <ChevronDownIcon />
            </div>

            <button
              type="button"
              onClick={handleCycleSort}
              title="Ubah urutan konten (Terbaru / Judul A-Z)"
              className="col-span-2 sm:col-auto inline-flex h-9 sm:h-11 items-center justify-center gap-2 rounded-xl sm:rounded-[14px] border border-[#F0F2EB] bg-white px-4 sm:px-5 hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <SortIcon />
              <span className="text-xs sm:text-[13px] font-medium text-[#72796E]">
                {sortLabel}
              </span>
            </button>
          </div>
        </div>
      </div>

      <EducationTable 
        contents={filteredContents} 
        onEdit={handleEdit} 
        onDelete={handleDeleteClick} 
      />

      <EducationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        content={editingContent}
        onSubmit={handleModalSubmit}
      />

      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
        title={successModal.title}
        message={successModal.message}
        buttonText="Tutup"
      />

      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          if (!isDeleting) setDeleteModal({ ...deleteModal, isOpen: false });
        }}
        onConfirm={confirmDelete}
        title="Hapus Konten?"
        itemName={deleteModal.name}
        confirmText="Hapus Konten"
        isDeleting={isDeleting}
      />
    </div>
  );
}
