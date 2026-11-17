'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { HeroSlide } from '@/types';
import { heroApi, getHeroImageUrl } from '@/lib/api/hero';
import { SuccessModal } from '@/components/admin/SuccessModal';
import { DeleteModal } from '@/components/admin/DeleteModal';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Upload,
  ArrowUpDown,
  Search,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

export default function AdminHeroPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);

  // Form State
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success & Delete Modals
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

  const fetchSlides = async () => {
    setIsLoading(true);
    try {
      // Pass all=true to get active and inactive slides
      const data = await heroApi.getAll(true);
      setSlides(data);
    } catch (error) {
      console.error('Failed to fetch hero slides:', error);
      toast.error('Gagal mengambil data slide hero dari server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const filteredSlides = useMemo(() => {
    let result = [...slides];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (s) =>
          (s.altText || '').toLowerCase().includes(q) ||
          (s.caption || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [slides, searchTerm]);

  const handleOpenAddModal = () => {
    setEditingSlide(null);
    setAltText('');
    setCaption('');
    setLinkUrl('');
    setSortOrder(slides.length + 1);
    setIsActive(true);
    setSelectedFile(null);
    setPreviewUrl('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setAltText(slide.altText || '');
    setCaption(slide.caption || '');
    setLinkUrl(slide.linkUrl || '');
    setSortOrder(slide.sortOrder || 0);
    setIsActive(slide.isActive);
    setSelectedFile(null);
    setPreviewUrl(getHeroImageUrl(slide.imageUrl));
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 3MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingSlide && !selectedFile) {
      toast.error('Silakan pilih foto background slide');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('image', selectedFile);
      }
      formData.append('altText', altText);
      formData.append('caption', caption);
      formData.append('linkUrl', linkUrl);
      formData.append('sortOrder', String(sortOrder));
      formData.append('isActive', String(isActive));

      if (editingSlide) {
        await heroApi.update(editingSlide.id, formData);
        setSuccessModal({
          isOpen: true,
          title: 'Berhasil Memperbarui',
          message: 'Foto background slide hero berhasil diperbarui.',
        });
      } else {
        await heroApi.create(formData);
        setSuccessModal({
          isOpen: true,
          title: 'Berhasil Menambahkan',
          message: 'Foto background slide hero baru berhasil ditambahkan.',
        });
      }

      setIsModalOpen(false);
      fetchSlides();
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Gagal menyimpan slide');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await heroApi.toggleActive(id);
      fetchSlides();
      toast.success('Status tampilan slide berhasil diubah');
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Gagal mengubah status slide');
    }
  };

  const handleDeleteClick = (slide: HeroSlide) => {
    setDeleteModal({
      isOpen: true,
      id: slide.id,
      name: slide.altText || slide.caption || 'Slide Hero',
    });
  };

  const confirmDelete = async () => {
    try {
      await heroApi.delete(deleteModal.id);
      setSuccessModal({
        isOpen: true,
        title: 'Berhasil Menghapus',
        message: 'Foto background slide hero berhasil dihapus.',
      });
      fetchSlides();
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || 'Gagal menghapus slide');
    } finally {
      setDeleteModal({ isOpen: false, id: '', name: '' });
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* ─── HEADER ─── */}
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2D5A27] text-white shadow-md">
              <SlidersHorizontal size={20} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B361F] tracking-tight">
                Kelola Foto Background Hero
              </h1>
              <p className="text-xs sm:text-sm text-[#5D705C] font-medium mt-0.5">
                Atur foto background slider pada halaman pertama (Landing Page)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FC9430] hover:bg-[#e07f24] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:shadow-lg transition-all duration-200 active:scale-95"
          type="button"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Tambah Foto Baru</span>
        </button>
      </header>

      {/* ─── STATS & SEARCH ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[#E4EAE1] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#6E826D] uppercase tracking-wider">Total Slide</p>
          <p className="text-3xl font-extrabold text-[#1B361F] mt-1">{slides.length}</p>
        </div>
        <div className="rounded-2xl border border-[#E4EAE1] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#6E826D] uppercase tracking-wider">Slide Aktif</p>
          <p className="text-3xl font-extrabold text-[#2D5A27] mt-1">
            {slides.filter((s) => s.isActive).length}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E4EAE1] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#6E826D] uppercase tracking-wider">Slide Nonaktif</p>
          <p className="text-3xl font-extrabold text-[#9A9A9A] mt-1">
            {slides.filter((s) => !s.isActive).length}
          </p>
        </div>
      </div>

      {/* ─── SEARCH BAR ─── */}
      <div className="rounded-2xl border border-[#E4EAE1] bg-white p-3 shadow-sm">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7E917D]" />
          <input
            type="text"
            placeholder="Cari berdasarkan judul, alt text, atau keterangan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl bg-[#F6F8F5] py-2.5 pl-11 pr-4 text-sm text-[#1B361F] placeholder:text-[#9FB19E] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
          />
        </div>
      </div>

      {/* ─── SLIDES LIST (CARDS GRID) ─── */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[350px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2D5A27]" />
        </div>
      ) : filteredSlides.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#C5D3C2] bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F1F5EF] text-[#2D5A27]">
            <Upload size={24} />
          </div>
          <h3 className="mt-4 text-base font-bold text-[#1B361F]">Belum ada foto slide background</h3>
          <p className="mt-1 text-sm text-[#6E826D]">
            Tambahkan foto untuk carousel background hero di halaman beranda.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2D5A27] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:brightness-110"
          >
            <Plus size={16} /> Tambah Foto Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSlides.map((slide, index) => {
            const imgUrl = getHeroImageUrl(slide.imageUrl);
            return (
              <div
                key={slide.id}
                className={`group relative flex flex-col rounded-2xl border transition-all duration-200 overflow-hidden bg-white shadow-sm hover:shadow-md ${
                  slide.isActive ? 'border-[#C5D3C2]' : 'border-gray-200 opacity-75'
                }`}
              >
                {/* Image Thumbnail with Overlay Badges */}
                <div className="relative h-48 w-full bg-black/10 overflow-hidden">
                  <Image
                    src={imgUrl}
                    alt={slide.altText || 'Foto Hero'}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Top Left: Sort Order Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md">
                    <ArrowUpDown size={12} />
                    <span>Urutan: {slide.sortOrder}</span>
                  </div>

                  {/* Top Right: Status Badge */}
                  <button
                    onClick={() => handleToggleActive(slide.id)}
                    title={slide.isActive ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                    className={`absolute top-3 right-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-md transition-all shadow-sm ${
                      slide.isActive
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-zinc-700 text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    {slide.isActive ? (
                      <>
                        <CheckCircle2 size={12} /> Aktif
                      </>
                    ) : (
                      <>
                        <XCircle size={12} /> Nonaktif
                      </>
                    )}
                  </button>

                  {/* Bottom: Caption/Alt */}
                  <div className="absolute bottom-2.5 left-3 right-3">
                    <p className="text-xs font-semibold text-white truncate drop-shadow">
                      {slide.altText || slide.caption || 'Tanpa keterangan'}
                    </p>
                  </div>
                </div>

                {/* Content details */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-[#7B8E79] font-medium">Keterangan / Caption:</p>
                    <p className="text-sm font-semibold text-[#1B361F] line-clamp-2">
                      {slide.caption || slide.altText || '–'}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between border-t border-[#EEF2EC] pt-3 mt-auto">
                    <a
                      href={imgUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#2D5A27] hover:underline"
                    >
                      <Eye size={14} /> Lihat Foto
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(slide)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F1F5EF] text-[#2D5A27] hover:bg-[#2D5A27] hover:text-white transition-colors"
                        title="Edit Slide"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(slide)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors"
                        title="Hapus Slide"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── ADD / EDIT MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-[#EEF2EC]">
              <h2 className="text-xl font-bold text-[#1B361F]">
                {editingSlide ? 'Edit Foto Slide Hero' : 'Tambah Foto Slide Hero'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1 text-[#7E917D] hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* File Upload / Preview */}
              <div>
                <label className="block text-xs font-bold text-[#1B361F] uppercase tracking-wider mb-2">
                  Foto Background {editingSlide ? '(Biarkan kosong jika tidak diganti)' : '*'}
                </label>

                {previewUrl ? (
                  <div className="relative h-44 w-full rounded-2xl overflow-hidden border border-[#C5D3C2] bg-black/5 group">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    <label
                      htmlFor="hero-image-input"
                      className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-xs font-semibold gap-1"
                    >
                      <Upload size={20} />
                      <span>Klik untuk ganti foto</span>
                    </label>
                  </div>
                ) : (
                  <label
                    htmlFor="hero-image-input"
                    className="flex flex-col items-center justify-center h-44 w-full border-2 border-dashed border-[#C5D3C2] hover:border-[#2D5A27] rounded-2xl bg-[#F6F8F5] cursor-pointer transition-colors p-4 text-center"
                  >
                    <Upload size={28} className="text-[#2D5A27] mb-2" />
                    <span className="text-sm font-bold text-[#1B361F]">Pilih Foto Background</span>
                    <span className="text-xs text-[#7E917D] mt-1">
                      Format JPG, PNG, atau WebP (Disarankan 1920x1080, Maks 3MB)
                    </span>
                  </label>
                )}
                <input
                  id="hero-image-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Alt Text / Judul */}
              <div>
                <label className="block text-xs font-bold text-[#1B361F] uppercase tracking-wider mb-1.5">
                  Judul / Alt Text
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Aksi gotong royong pemilahan sampah warga..."
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className="w-full rounded-xl border border-[#D7E0D4] bg-[#F9FAF8] px-4 py-2.5 text-sm text-[#1B361F] focus:border-[#2D5A27] focus:bg-white focus:outline-none"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-bold text-[#1B361F] uppercase tracking-wider mb-1.5">
                  Keterangan Acara / Caption (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan singkat tentang kegiatan dalam foto..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full rounded-xl border border-[#D7E0D4] bg-[#F9FAF8] px-4 py-2 text-sm text-[#1B361F] focus:border-[#2D5A27] focus:bg-white focus:outline-none"
                />
              </div>

              {/* Urutan & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1B361F] uppercase tracking-wider mb-1.5">
                    Urutan Slide
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-xl border border-[#D7E0D4] bg-[#F9FAF8] px-4 py-2.5 text-sm text-[#1B361F] focus:border-[#2D5A27] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1B361F] uppercase tracking-wider mb-1.5">
                    Status Tampilan
                  </label>
                  <div className="flex h-[42px] items-center">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300 text-[#2D5A27] focus:ring-[#2D5A27]"
                      />
                      <span className="text-sm font-semibold text-[#1B361F]">
                        {isActive ? 'Aktif (Tampil)' : 'Nonaktif'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EEF2EC]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2D5A27] hover:bg-[#23481f] px-6 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : editingSlide ? 'Simpan Perubahan' : 'Tambah Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── SUCCESS MODAL ─── */}
      <SuccessModal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
        title={successModal.title}
        message={successModal.message}
        buttonText="Tutup"
      />

      {/* ─── DELETE MODAL ─── */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={confirmDelete}
        title="Hapus Foto Slide Hero?"
        itemName={deleteModal.name}
        confirmText="Hapus Slide"
      />
    </div>
  );
}
