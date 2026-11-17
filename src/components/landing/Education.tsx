'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { ConcentricCircles, OutlineLeaf } from '@/components/ui/DecorativeElements';

import { getBaseUrl } from '@/lib/api-config';

interface EducationItem {
  id: string | number;
  title: string;
  slug: string;
  overview?: string;
  description?: string;
  thumbnail?: string;
  tags?: string[];
  publishDate?: string;
  readTime?: string;
}

interface EducationProps {
  items?: EducationItem[];
}

const BASE_URL = getBaseUrl();

const DEFAULT_ARTICLES = [
  {
    id: 1,
    tagLine: '5R Method · 5 Menit Baca',
    title: 'Prinsip 5R: Menolak Sampah dari Sumbernya',
    description:
      'Panduan praktis menolak kemasan sekali pakai dan memulai kebiasaan baru di rumah.',
    image: '/activity/Pengmas (7).jpeg',
    slug: 'prinsip-5r-menolak-sampah',
  },
  {
    id: 2,
    tagLine: 'Ekonomi Sirkular · 4 Menit Baca',
    title: 'Manfaat Bank Sampah bagi Ekonomi Keluarga',
    description:
      'Ubah limbah anorganik bernilai ekonomis untuk menopang dana kebutuhan rumah tangga.',
    image: '/activity/Pengmas (8).jpeg',
    slug: 'manfaat-bank-sampah-ekonomi-keluarga',
  },
  {
    id: 3,
    tagLine: 'Gaya Hidup · 6 Menit Baca',
    title: 'Mengenal Konsep Zero Waste untuk Pemula',
    description:
      'Langkah realistis tanpa stres untuk mengurangi beban TPA tanpa harus mengubah semuanya sekaligus.',
    image: '/activity/Pengmas (9).jpeg',
    slug: 'mengenal-konsep-zero-waste-pemula',
  },
  {
    id: 4,
    tagLine: 'Kreasi Upcycle · 7 Menit Baca',
    title: 'Kreatif Mendaur Ulang Plastik Bekas Jadi Bernilai',
    description:
      'Teknik sederhana mengolah limbah botol PET dan HDPE menjadi perabot yang berguna.',
    image: '/activity/Pengmas (10).jpeg',
    slug: 'kreatif-mendaur-ulang-plastik-bekas',
  },
];

function formatImageUrl(src?: string | null, fallback: string = ''): string {
  if (!src) return fallback;
  if (src.startsWith('http')) return src;
  if (src.startsWith('/')) return src;
  return `${BASE_URL}/${src}`;
}

export function Education({ items }: EducationProps) {
  const articles =
    items && items.length > 0
      ? items.slice(0, 4).map((item, idx) => ({
          id: item.id,
          tagLine:
            item.tags && item.tags.length > 0
              ? `${item.tags[0]} · 5 Menit Baca`
              : DEFAULT_ARTICLES[idx]?.tagLine || 'Edukasi Lingkungan',
          title: item.title,
          description: item.overview || item.description || '',
          image: formatImageUrl(item.thumbnail, DEFAULT_ARTICLES[idx]?.image),
          slug: item.slug,
        }))
      : DEFAULT_ARTICLES;

  return (
    <section
      id="edukasi"
      className="relative w-full overflow-hidden bg-white py-20 lg:py-28"
    >
      {/* ─── DECORATIVE ACCENTS (Figma Frame 48: ConcentricCircles #FC9634 & OutlineLeaf) ─── */}
      <div className="absolute -right-24 -bottom-24 opacity-35 pointer-events-none">
        <ConcentricCircles size={360} color="#FC9634" />
      </div>
      <div className="absolute -left-20 -top-20 opacity-20 pointer-events-none rotate-[-15deg]">
        <OutlineLeaf size={340} color="#203220" strokeWidth={6.72} />
      </div>

      <Container className="relative z-10">
        {/* ─── SECTION HEADER ─── */}
        <div className="pb-12 max-w-[640px]">
          <h2 className="font-['Poppins'] font-bold text-3xl sm:text-4xl lg:text-[44px] leading-tight text-[#012D1D] tracking-[-1px]">
            Pusat Edukasi
          </h2>
          <p className="font-['Poppins'] font-normal text-base sm:text-lg text-[#3D3D3D] mt-2">
            Pahami cara mengelola sampah dengan benar untuk masa depan yang lebih baik.
          </p>
        </div>

        {/* ─── 4 CARDS GRID (Figma: 286px each) ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {articles.map((art, idx) => (
            <div
              key={art.id || idx}
              className="flex flex-col justify-between rounded-[14px] bg-white border border-[#D1D8D2] hover:border-[#012D1D] p-4 sm:p-5 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5 group"
            >
              <div>
                {/* Image (Figma: 286px x 200px) */}
                <div className="relative h-[190px] w-full rounded-[10px] overflow-hidden bg-gray-50 border border-black/5 flex items-center justify-center">
                  <img
                    src={art.image}
                    alt={art.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallback = `/activity/Pengmas (${idx + 7}).jpeg`;
                      if (target.src !== fallback) {
                        target.src = fallback;
                      }
                    }}
                  />
                </div>

                {/* Tag & Reading Time */}
                <p className="font-['Poppins'] font-semibold text-xs sm:text-sm text-[#012D1D] mt-4">
                  {art.tagLine}
                </p>

                {/* Title (Figma: 18px 700 #111111) */}
                <h3 className="font-['Poppins'] font-bold text-lg leading-[25px] text-[#111111] mt-2 group-hover:text-[#FC9634] transition-colors line-clamp-2">
                  {art.title}
                </h3>

                {/* Description (Figma: 14px 400 #3D3D3D) */}
                <p className="font-['Poppins'] font-normal text-sm leading-[21px] text-[#3D3D3D] mt-2 line-clamp-3">
                  {art.description}
                </p>
              </div>

              {/* Read Article Link */}
              <div className="pt-4 mt-auto">
                <Link
                  href={`/edukasi/${art.slug || art.id}`}
                  className="font-['Poppins'] font-semibold text-base text-[#012D1D] underline underline-offset-4 hover:text-[#FC9634] transition-colors inline-block"
                >
                  Baca artikel
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* ─── BUTTON: TAMPILKAN SEMUA ARTIKEL ─── */}
        <div className="mt-12">
          <Link
            href="/edukasi"
            className="inline-flex items-center justify-center w-full sm:w-[255px] h-[48px] rounded-[8px] border-2 border-[#012D1D] text-[#012D1D] font-['Poppins'] font-semibold text-base hover:bg-[#012D1D] hover:text-white transition-all duration-200"
          >
            Tampilkan semua artikel
          </Link>
        </div>
      </Container>
    </section>
  );
}

export default Education;
