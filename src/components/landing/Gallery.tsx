'use client';

import React from 'react';
import { Container } from '@/components/layout/Container';
import { SafeImage } from '@/components/shared/SafeImage';
import { Gallery as GalleryType } from '@/types';
import { getGalleryImageUrl } from '@/lib/api/gallery';
import { ConcentricCircles, OutlineLeaf } from '@/components/ui/DecorativeElements';

interface GalleryProps {
  items?: GalleryType[];
}

const DEFAULT_GALLERY = [
  {
    id: 'gal-1',
    title: 'Kunjungan Mahasiswa Telkom',
    description: 'Kolaborasi Teman Pilah dengan kampus Telkom University',
    image: '/pengmas 3.jpg',
    fallback: '/pengmas 3.jpg',
  },
  {
    id: 'gal-2',
    title: 'Foto Bersama Dosen Telkom',
    description: 'Kunjungan Pengabdian Masyarakat',
    image: '/pengmas 1.jpg',
    fallback: '/pengmas 1.jpg',
  },
  {
    id: 'gal-3',
    title: 'Kolaborasi Bank Sampah',
    description: 'Kerja sama Teman Pilah dengan bank sampah',
    image: '/activity/Pengmas (14).jpeg',
    fallback: '/activity/Pengmas (14).jpeg',
  },
  {
    id: 'gal-4',
    title: 'Rapat Komunitas Teman Pilah',
    description: 'Rapat bersama ibu dosen Telkom University',
    image: '/activity/Pengmas (15).jpeg',
    fallback: '/activity/Pengmas (15).jpeg',
  },
  {
    id: 'gal-5',
    title: 'Kunjungan SD Mekar ke Teman Pilah',
    description: 'SD Mekar Sari belajar di Teman Pilah',
    image: '/activity/Pengmas (16).jpeg',
    fallback: '/activity/Pengmas (16).jpeg',
  },
];

export function Gallery({ items }: GalleryProps) {
  const galleryItems =
    items && items.length > 0
      ? items.slice(0, 5).map((item, idx) => ({
          id: item.id,
          title: item.title || DEFAULT_GALLERY[idx % DEFAULT_GALLERY.length]?.title || 'Kegiatan Teman Pilah',
          description: item.description || DEFAULT_GALLERY[idx % DEFAULT_GALLERY.length]?.description || '',
          image: getGalleryImageUrl(item.image) || DEFAULT_GALLERY[idx % DEFAULT_GALLERY.length]?.image,
          fallback: DEFAULT_GALLERY[idx % DEFAULT_GALLERY.length]?.fallback,
        }))
      : DEFAULT_GALLERY;

  const row1 = galleryItems.slice(0, 2);
  const row2 = galleryItems.slice(2, 5);

  return (
    <section
      id="galeri"
      className="relative w-full overflow-hidden bg-white py-10 sm:py-16 lg:py-28"
    >
      {/* ─── DECORATIVE ACCENTS (Figma Frame 48: ConcentricCircles #3B9734 & OutlineLeaf) ─── */}
      <div className="hidden sm:block absolute -right-24 -top-24 opacity-25 pointer-events-none">
        <ConcentricCircles size={360} color="#3B9734" />
      </div>
      <div className="hidden sm:block absolute -left-20 -bottom-20 opacity-20 pointer-events-none rotate-[20deg]">
        <OutlineLeaf size={340} color="#203220" strokeWidth={6.72} />
      </div>

      <Container className="relative z-10">
        {/* ─── SECTION HEADER ─── */}
        <div className="pb-6 sm:pb-12 max-w-[640px]">
          <h2 className="font-['Poppins'] font-bold text-2xl sm:text-4xl lg:text-[44px] leading-tight text-[#012D1D] tracking-[-0.5px] sm:tracking-[-1px]">
            Galeri Aksi Nyata
          </h2>
          <p className="font-['Poppins'] font-normal text-xs sm:text-lg text-[#3D3D3D] mt-1 sm:mt-2">
            Jejak langkah kami bersama masyarakat dan mitra dalam melestarikan lingkungan.
          </p>
        </div>

        {/* ─── ASYMMETRIC GRID (Figma spec) ─── */}
        <div className="flex flex-col gap-2.5 sm:gap-5">
          {/* ROW 1: 2 Items (699px & 497px in Figma) */}
          <div className="grid grid-cols-2 lg:grid-cols-12 gap-2.5 sm:gap-5">
            {row1[0] && (
              <div className="lg:col-span-7 relative h-[145px] sm:h-[240px] lg:h-[300px] rounded-xl sm:rounded-[16px] overflow-hidden bg-[#012D1D] shadow-md group border border-black/5">
                <SafeImage
                  src={row1[0].image}
                  fallbackSrc={row1[0].fallback}
                  alt={row1[0].title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Gradient overlay: #0B4A31 to transparent */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#0B4A31] via-[#0B4A31]/50 to-transparent opacity-90 transition-opacity group-hover:opacity-80 pointer-events-none"
                />
                {/* Content: Atas = Judul, Bawah = Deskripsi */}
                <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-6 flex flex-col gap-0.5 sm:gap-1 z-10">
                  <span className="font-['Poppins'] font-medium text-[10px] sm:text-sm text-[#C1ECD4] line-clamp-1">
                    {row1[0].title}
                  </span>
                  <h3 className="font-['Poppins'] font-semibold text-xs sm:text-lg lg:text-xl text-white line-clamp-2">
                    {row1[0].description}
                  </h3>
                </div>
              </div>
            )}

            {row1[1] && (
              <div className="lg:col-span-5 relative h-[145px] sm:h-[240px] lg:h-[300px] rounded-xl sm:rounded-[16px] overflow-hidden bg-[#012D1D] shadow-md group border border-black/5">
                <SafeImage
                  src={row1[1].image}
                  fallbackSrc={row1[1].fallback}
                  alt={row1[1].title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#0B4A31] via-[#0B4A31]/50 to-transparent opacity-90 transition-opacity group-hover:opacity-80 pointer-events-none"
                />
                <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-6 flex flex-col gap-0.5 sm:gap-1 z-10">
                  <span className="font-['Poppins'] font-medium text-[10px] sm:text-sm text-[#C1ECD4] line-clamp-1">
                    {row1[1].title}
                  </span>
                  <h3 className="font-['Poppins'] font-semibold text-xs sm:text-lg lg:text-xl text-white line-clamp-2">
                    {row1[1].description}
                  </h3>
                </div>
              </div>
            )}
          </div>

          {/* ROW 2: 3 Items (392px each in Figma) */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-5">
            {row2.map((item, idx) => (
              <div
                key={item.id || idx}
                className="relative h-[145px] sm:h-[240px] lg:h-[300px] rounded-xl sm:rounded-[16px] overflow-hidden bg-[#012D1D] shadow-md group border border-black/5"
              >
                <SafeImage
                  src={item.image}
                  fallbackSrc={item.fallback}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#012D1D] via-[#012D1D]/60 to-transparent opacity-90 transition-opacity group-hover:opacity-80 pointer-events-none"
                />
                <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-6 flex flex-col gap-0.5 sm:gap-1 z-10">
                  <span className="font-['Poppins'] font-medium text-[10px] sm:text-sm text-[#C1ECD4] line-clamp-1">
                    {item.title}
                  </span>
                  <h3 className="font-['Poppins'] font-semibold text-xs sm:text-lg text-white line-clamp-2">
                    {item.description}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

export default Gallery;
