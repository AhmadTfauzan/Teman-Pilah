'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { ConcentricCircles, OutlineLeaf } from '@/components/ui/DecorativeElements';

interface ProgramData {
  id: string | number;
  title: string;
  description: string;
  image?: string;
  slug?: string;
  category?: string;
  partnership?: string;
}

interface ProgramsProps {
  programs?: ProgramData[];
}

const DEFAULT_PROGRAMS: ProgramData[] = [
  {
    id: 1,
    category: 'Pengabdian Masyarakat',
    title: 'Pengmas: Digitalisasi Katalog',
    description:
      'Pengmas digitalisasi komunitas Teman Pilah bersama Telkom University Jakarta.',
    image: '/activity/Pengmas (1).jpeg',
    slug: 'pengmas-digitalisasi-katalog',
  },
  {
    id: 2,
    category: 'Bank Sampah',
    title: 'Bank Sampah Mandiri',
    description:
      'Pos penimbangan berkala dengan sistem tabungan digital, menukarkan sampah anorganik terpilah menjadi tabungan sembako.',
    image: '/activity/Pengmas (2).jpeg',
    slug: 'bank-sampah-mandiri',
  },
  {
    id: 3,
    category: 'Edukasi Sekolah',
    title: 'Teman Pilah Goes to School',
    description:
      'Membentuk kebiasaan memilah sejak dini lewat modul interaktif, kompetisi duta cilik lingkungan, dan biopori di halaman sekolah.',
    image: '/activity/Pengmas (3).jpeg',
    slug: 'teman-pilah-goes-to-school',
  },
];

export function Programs({ programs }: ProgramsProps) {
  const displayPrograms =
    programs && programs.length > 0
      ? programs.slice(0, 3).map((p, i) => ({
          ...p,
          category:
            p.category ||
            (i === 0
              ? 'Pengabdian Masyarakat'
              : i === 1
              ? 'Bank Sampah'
              : 'Edukasi Sekolah'),
        }))
      : DEFAULT_PROGRAMS;

  return (
    <section
      id="program"
      className="relative w-full overflow-hidden bg-[#F1F4F9] py-20 lg:py-28"
    >
      {/* ─── DECORATIVE ACCENTS (Figma Frame 48: ConcentricCircles #FC9634 & OutlineLeaf) ─── */}
      <div className="absolute -right-24 -top-24 opacity-35 pointer-events-none">
        <ConcentricCircles size={360} color="#FC9634" />
      </div>
      <div className="absolute -left-20 -bottom-20 opacity-20 pointer-events-none rotate-[-20deg]">
        <OutlineLeaf size={340} color="#203220" strokeWidth={6.72} />
      </div>

      <Container className="relative z-10">
        {/* ─── SECTION HEADER ─── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12">
          <div>
            <h2 className="font-['Poppins'] font-bold text-3xl sm:text-4xl lg:text-[44px] leading-tight text-[#012D1D] tracking-[-1px]">
              Program Unggulan
            </h2>
            <p className="font-['Poppins'] font-normal text-base sm:text-lg text-[#3D3D3D] mt-2 max-w-[640px]">
              Inisiatif yang kami jalankan untuk menggerakkan masyarakat menjaga
              kelestarian bumi.
            </p>
          </div>

          <Link
            href="/program"
            className="font-['Poppins'] font-semibold text-base text-[#012D1D] underline underline-offset-4 hover:text-[#FC9634] transition-colors whitespace-nowrap self-start md:self-end"
          >
            Lihat seluruh program
          </Link>
        </div>

        {/* ─── 3 CARDS GRID ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {displayPrograms.map((item, idx) => (
            <div
              key={item.id || idx}
              className="flex flex-col rounded-[10px] bg-white overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 border border-black/5"
            >
              {/* Card Image (Figma: 389px x 240px) */}
              <div className="relative h-[220px] sm:h-[240px] w-full bg-gray-100 overflow-hidden flex items-center justify-center">
                <img
                  src={item.image || `/activity/Pengmas (${(idx % 10) + 1}).jpeg`}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  onError={(e) => {
                    const target = e.currentTarget;
                    const fallback = `/activity/Pengmas (${(idx % 10) + 1}).jpeg`;
                    if (target.src !== fallback) {
                      target.src = fallback;
                    }
                  }}
                />
              </div>

              {/* Card Content (Figma: padding 24px) */}
              <div className="p-6 flex flex-col flex-1 justify-between gap-4">
                <div className="space-y-2">
                  {/* Category Tag */}
                  <span className="font-['Poppins'] font-semibold text-sm text-[#E8801A] block">
                    {item.category || 'Program Komunitas'}
                  </span>

                  {/* Title */}
                  <h3 className="font-['Poppins'] font-bold text-xl sm:text-[22px] leading-snug text-[#012D1D]">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="font-['Poppins'] font-normal text-sm sm:text-base text-[#3D3D3D] leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                </div>

                {/* Learn More Link */}
                <div className="pt-2">
                  <Link
                    href={`/program/${item.slug || item.id}`}
                    className="font-['Poppins'] font-semibold text-base text-[#012D1D] underline underline-offset-4 hover:text-[#FC9634] transition-colors inline-block"
                  >
                    Pelajari lebih lanjut
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default Programs;
