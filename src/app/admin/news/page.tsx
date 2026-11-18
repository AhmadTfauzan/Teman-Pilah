'use client';

import { getBaseUrl } from '../../../lib/api-config';
import { useEffect, useState, useMemo } from 'react';
import { News } from '@/types';
import { newsApi } from '@/lib/api/news';
import { NewsTable } from '@/components/admin/NewsTable';
import { NewsModal, NewsModalSubmitData } from '@/components/admin/NewsModal';
import { DeleteModal } from '@/components/admin/DeleteModal';
import { SuccessModal } from '@/components/admin/SuccessModal';
import { toast } from 'sonner';

const BASE_URL = getBaseUrl();

function resolveNewsImageUrl(imagePath?: string | null): string {
  const path = imagePath?.trim();
  if (!path) return '';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    (path.startsWith('/') && !path.startsWith('//'))
  ) {
    return path;
  }
  const cleanPath = path.replace(/^\/+/, '');
  const cleanBase = BASE_URL.replace(/\/+$/, '');
  return cleanBase ? `${cleanBase}/${cleanPath}` : `/${cleanPath}`;
}

function normalizeNews(item: News): News {
  return {
    ...item,
    image: resolveNewsImageUrl(item.imageUrl || item.image),
  };
}

export default function AdminNewsPage() {

  const [newsList, setNewsList] =
    useState<News[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [selectedNews, setSelectedNews] =
    useState<News | null>(null);

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [deletingNews, setDeletingNews] =
    useState<News | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({ isOpen: false, title: '', message: '' });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  const filteredNewsList = useMemo(() => {
    const now = new Date();
    const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const todayStr = wibTime.toISOString().split('T')[0];

    return newsList
      .filter((news) => {
        // Search by title
        if (searchTerm && !news.title.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }

        // Filter by Status
        if (filterStatus !== 'all') {
          if (filterStatus === 'draft') {
            if (news.status !== 'DRAFT') return false;
          } else {
            if (news.status !== 'PUBLISHED') return false;
            const startStr = news.publishDate ? news.publishDate.split('T')[0] : '';
            const endStr = news.endDate ? news.endDate.split('T')[0] : '';

            if (filterStatus === 'ongoing') {
              if (!startStr) return false; // Needs a start date to be ongoing
              if (startStr > todayStr) return false;
              if (endStr && endStr < todayStr) return false;
            } else if (filterStatus === 'upcoming') {
              if (!startStr) return false;
              if (startStr <= todayStr) return false;
            } else if (filterStatus === 'completed') {
              if (!endStr) return false; // Needs an end date to be completed
              if (endStr >= todayStr) return false;
            }
          }
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        
        if (sortOrder === 'newest') return dateB - dateA;
        if (sortOrder === 'oldest') return dateA - dateB;
        return 0;
      });
  }, [newsList, searchTerm, filterStatus, sortOrder]);

  // =========================
  // FETCH NEWS
  // =========================

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await newsApi.getAll();
        if (!cancelled) {
          setNewsList(data.map(normalizeNews));
        }
      } catch (error) {
        console.error('Fetch News Error:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================
  // CREATE / UPDATE
  // =========================

  async function handleSubmit(data: NewsModalSubmitData) {
    try {
      const payload = {
        title: data.title,
        content: data.content,
        category: data.category || 'Edukasi',
        status: data.status || 'PUBLISHED',
        slug:
          data.slug ||
          data.title
            ?.toLowerCase()
            .replace(/\s+/g, '-'),
        summary:
          data.summary ||
          data.content?.slice(0, 120),
        authors: ['Admin'],
        tags: Array.isArray(data.tags) ? data.tags : [],
        visibility: 'PUBLIC' as const,
        publishDate: data.publishDate || null,
        endDate: data.endDate || null,
        partnership: data.partnership || null,
        imageFile: data.imageFile || null,
      };

      const isEditing = Boolean(selectedNews);

      if (selectedNews) {
        const updated = await newsApi.update(selectedNews.id, payload);

        setNewsList((prev) =>
          prev.map((item) =>
            item.id === updated.id ? normalizeNews(updated) : item
          )
        );
      } else {
        const created = await newsApi.create(payload);

        setNewsList((prev) => [normalizeNews(created), ...prev]);
      }

      setIsModalOpen(false);
      setSelectedNews(null);

      setSuccessModal({
        isOpen: true,
        title: 'Berhasil!',
        message: isEditing
          ? 'Program berhasil diperbarui. Kerja Bagus!'
          : 'Program berhasil ditambahkan. Kerja Bagus!',
      });
    } catch (error) {
      console.error('Submit News Error:', error);

      toast.error(
        error instanceof Error ? error.message : 'Gagal menyimpan program'
      );
      throw error;
    }
  }

  // =========================
  // DELETE
  // =========================

  function handleDeleteClick(news: News) {
    setDeletingNews(news);
  }

  async function confirmDelete() {
    if (!deletingNews || isDeleting) return;
    const target = deletingNews;
    setIsDeleting(true);
    try {
      await newsApi.delete(target.id, target.title);
      setNewsList((prev) => prev.filter((item) => item.id !== target.id));
      setDeletingNews(null);
      setSuccessModal({
        isOpen: true,
        title: 'Berhasil!',
        message: 'Program berhasil dihapus. Kerja Bagus!',
      });
    } catch (error) {
      console.error('Delete News Error:', error);
      toast.error(error instanceof Error ? error.message : 'Gagal menghapus program');
    } finally {
      setIsDeleting(false);
    }
  }

  // =========================
  // EDIT
  // =========================

  function handleEdit(
    news: News
  ) {

    setSelectedNews(news);

    setIsModalOpen(true);
  }

  return (
    <div className="space-y-5 sm:space-y-8">

      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-3 sm:gap-5">
        <div>
          <h1 className="font-serif text-2xl sm:text-[32px] font-bold leading-tight sm:leading-[38.4px] text-[#2A3426] tracking-tight">
            Kelola Program
          </h1>
        </div>

        <button
          onClick={() => {
            setSelectedNews(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#27532B] px-3.5 py-2 sm:px-5 sm:py-2.5 hover:brightness-110 transition-all text-white font-medium text-xs sm:text-[13px]"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Program Baru</span>
        </button>
      </header>

      {/* FILTER SECTION */}
      <div className="rounded-2xl sm:rounded-[20px] border border-[#F0F2EB] bg-white p-2 sm:p-2.5 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          {/* SEARCH */}
          <div className="relative flex-1">
            <label className="sr-only" htmlFor="program-search">
              Cari berdasarkan judul...
            </label>
            <div className="flex h-10 sm:h-11 items-center rounded-xl sm:rounded-[14px] bg-[#F9FAF8] pl-9 sm:pl-10 pr-4">
              <input
                id="program-search"
                placeholder="Cari berdasarkan judul..."
                type="text"
                autoComplete="off"
                className="w-full border-none bg-transparent text-xs sm:text-[13px] text-[#42493e] outline-none placeholder:text-[#A1A89A]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 opacity-50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
          </div>

          {/* FILTERS */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row">
            <div className="relative w-full sm:w-[150px]">
              <select
                className="h-9 sm:h-11 w-full appearance-none rounded-xl sm:rounded-[14px] bg-[#F9FAF8] px-3 sm:px-4 pr-8 sm:pr-10 text-xs sm:text-[13px] font-medium text-[#2A3426] outline-none cursor-pointer"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Status: Semua</option>
                <option value="ongoing">Aktif</option>
                <option value="upcoming">Mendatang</option>
                <option value="completed">Selesai</option>
                <option value="draft">Draft</option>
              </select>
              <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>

            <div className="relative w-full sm:w-[150px]">
              <select
                className="h-9 sm:h-11 w-full appearance-none rounded-xl sm:rounded-[14px] bg-[#F9FAF8] px-3 sm:px-4 pr-8 sm:pr-10 text-xs sm:text-[13px] font-medium text-[#2A3426] outline-none cursor-pointer"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="newest">Tanggal: Terbaru</option>
                <option value="oldest">Tanggal: Terlama</option>
              </select>
              <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>

            <button
              type="button"
              className="col-span-2 sm:col-auto inline-flex h-9 sm:h-11 items-center justify-center gap-2 rounded-xl sm:rounded-[14px] border border-[#F0F2EB] bg-white px-4 sm:px-5 hover:bg-gray-50 transition-colors"
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
              <span className="text-xs sm:text-[13px] font-medium text-[#2A3426]">Urutkan</span>
            </button>
          </div>
        </div>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="py-20 text-center">
          Loading...
        </div>
      ) : (

        <NewsTable
          newsList={
            filteredNewsList
          }
          onEdit={
            handleEdit
          }
          onDelete={
            handleDeleteClick
          }
        />

      )}

      {/* MODAL */}
      <NewsModal
        news={
          selectedNews
        }
        isOpen={
          isModalOpen
        }
        onClose={() => {

          setIsModalOpen(
            false
          );

          setSelectedNews(
            null
          );

        }}
        onSubmit={
          handleSubmit
        }
      />

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteModal
        isOpen={deletingNews !== null}
        onClose={() => {
          if (!isDeleting) setDeletingNews(null);
        }}
        onConfirm={confirmDelete}
        itemName={deletingNews?.title}
        isDeleting={isDeleting}
      />

      {/* SUCCESS MODAL */}
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
        title={successModal.title}
        message={successModal.message}
        buttonText="Tutup"
      />

    </div>
  );
}