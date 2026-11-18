import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Building,
  CalendarDays,
  CheckCircle2,
  Layers,
  Tag,
} from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { ConcentricCircles, OutlineLeaf } from '@/components/ui/DecorativeElements';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Program Unggulan | Teman Pilah',
  description:
    'Daftar lengkap program dan inisiatif komunitas Teman Pilah bersama mitra dalam gerakan pilah sampah, bank sampah, dan pengabdian masyarakat.',
};

interface ProgramCardItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  imageUrl: string | null;
  category: string;
  tags: string[];
  publishDate: Date | null;
  endDate: Date | null;
  partnership: string | null;
  createdAt: Date;
  isOngoing: boolean;
}

const FALLBACK_PROGRAM_IMAGES = [
  '/activity/Pengmas (1).jpeg',
  '/activity/Pengmas (2).jpeg',
  '/activity/Pengmas (3).jpeg',
  '/activity/Pengmas (4).jpeg',
  '/activity/Pengmas (5).jpeg',
  '/activity/Pengmas (6).jpeg',
];

function resolveProgramImage(imageUrl: string | null | undefined, index: number): string {
  const fallback = FALLBACK_PROGRAM_IMAGES[index % FALLBACK_PROGRAM_IMAGES.length];
  if (!imageUrl) return fallback;

  const trimmed = imageUrl.trim();
  if (!trimmed) return fallback;

  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }

  // Fallback to local asset if stored path is a non-rooted relative path
  return fallback;
}

function toWibDateStr(date: Date): string {
  const wib = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().split('T')[0];
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatDateRange(publishDate: Date | null, endDate: Date | null): string {
  const formatOpts: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };

  const startText = publishDate ? publishDate.toLocaleDateString('id-ID', formatOpts) : '';
  const endText = endDate ? endDate.toLocaleDateString('id-ID', formatOpts) : '';

  if (startText && endText) return `${startText} – ${endText}`;
  if (startText) return startText;
  if (endText) return `Hingga ${endText}`;
  return 'Program Komunitas';
}

export default async function ProgramIndexPage() {
  const todayStr = toWibDateStr(new Date());
  let rawPrograms: Array<{
    id: string;
    title: string;
    slug: string;
    summary: string | null;
    content: string;
    imageUrl: string | null;
    category: string;
    tags: string[];
    publishDate: Date | null;
    endDate: Date | null;
    partnership: string | null;
    createdAt: Date;
  }> = [];

  try {
    rawPrograms = await prisma.news.findMany({
      where: {
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
      },
      orderBy: { publishDate: 'desc' },
    });
  } catch (error) {
    console.error('Failed to fetch public programs from database:', error);
  }

  const programs: ProgramCardItem[] = rawPrograms
    .filter((item) => {
      // Filter out programs scheduled for a future publish date
      if (item.publishDate) {
        const startStr = toWibDateStr(item.publishDate);
        if (startStr > todayStr) return false;
      }
      return true;
    })
    .map((item) => {
      const endStr = item.endDate ? toWibDateStr(item.endDate) : null;
      const isOngoing = !endStr || endStr >= todayStr;
      return {
        ...item,
        isOngoing,
      };
    })
    .sort((a, b) => {
      const timeA = (a.publishDate ?? a.createdAt).getTime();
      const timeB = (b.publishDate ?? b.createdAt).getTime();
      return timeB - timeA;
    });

  const ongoingCount = programs.filter((item) => item.isOngoing).length;
  const completedCount = programs.length - ongoingCount;

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#3D3D3D]">
      {/* ─── HERO HEADER BANNER ─── */}
      <section className="relative overflow-hidden bg-[#012D1D] pt-20 pb-10 sm:pt-32 sm:pb-16 lg:pb-20 text-white">
        <div className="absolute -right-24 -top-24 opacity-25 pointer-events-none">
          <ConcentricCircles size={360} color="#0B4A31" />
        </div>
        <div className="hidden sm:block absolute -left-20 -bottom-24 opacity-25 pointer-events-none rotate-[-20deg]">
          <OutlineLeaf size={380} color="#203220" strokeWidth={6.72} />
        </div>

        <Container className="relative z-10">
          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#C9D6CF] font-poppins mb-4 sm:mb-6"
          >
            <Link href="/" className="hover:text-white transition-colors">
              Beranda
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/#program" className="hover:text-white transition-colors">
              Program
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#FC9634] font-semibold">Semua Program</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-[#0B4A31] border border-[#3B9734]/40 px-3 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-sm font-semibold text-[#80E478] mb-3 sm:mb-4">
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Inisiatif &amp; Kolaborasi Masyarakat</span>
            </div>

            <h1 className="font-poppins font-bold text-2xl sm:text-4xl lg:text-5xl leading-tight text-white tracking-[-0.5px] sm:tracking-[-1px]">
              Program <span className="text-[#FC9634]">Teman Pilah</span>
            </h1>

            <p className="font-poppins font-normal text-xs sm:text-lg text-[#C9D6CF] mt-2 sm:mt-3 leading-relaxed">
              Telusuri seluruh inisiatif aktif dan arsip kegiatan kolaboratif kami bersama mitra
              untuk menggerakkan masyarakat menjaga kelestarian bumi.
            </p>

            <div className="pt-4 sm:pt-6 flex flex-wrap items-center gap-2.5 sm:gap-3">
              <Link
                href="/#program"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Kembali ke Beranda</span>
              </Link>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3B9734]/25 border border-[#80E478]/30 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#80E478]">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{ongoingCount} Berjalan</span>
              </span>

              {completedCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FC9634]/15 border border-[#FC9634]/40 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#FC9634]">
                  <Archive className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{completedCount} Arsip Selesai</span>
                </span>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ─── PROGRAMS GRID ─── */}
      <section className="relative py-8 sm:py-14 lg:py-20 overflow-hidden">
        <div className="hidden sm:block absolute -left-24 bottom-12 opacity-20 pointer-events-none">
          <ConcentricCircles size={320} color="#FC9634" />
        </div>

        <Container className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-5 sm:pb-10 border-b border-[#E5E2DC] mb-6 sm:mb-10">
            <div>
              <h2 className="font-poppins font-bold text-lg sm:text-2xl lg:text-3xl text-[#012D1D]">
                Daftar Program Publik
              </h2>
              <p className="font-poppins text-xs sm:text-base text-[#3D3D3D] mt-1">
                Informasi program yang sedang berlangsung maupun dokumentasi inisiatif terdahulu.
              </p>
            </div>
            <span className="font-poppins text-xs sm:text-sm font-semibold text-[#012D1D] bg-[#E8F5E9] border border-[#CFE7CA] px-3 py-1.5 rounded-full self-start sm:self-auto">
              Total {programs.length} program
            </span>
          </div>

          {programs.length === 0 ? (
            <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#E5E2DC] p-8 sm:p-14 text-center shadow-sm max-w-2xl mx-auto">
              <div className="mx-auto w-14 h-14 rounded-full bg-[#E8F5E9] text-[#012D1D] flex items-center justify-center mb-4">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="font-poppins font-bold text-lg sm:text-2xl text-[#012D1D]">
                Belum Ada Program Publik
              </h3>
              <p className="font-poppins text-xs sm:text-base text-[#3D3D3D] mt-2 leading-relaxed">
                Daftar program publik sedang dalam persiapan atau pembaruan jadwal tayang. Silakan
                kembali ke halaman utama untuk melihat informasi komunitas lainnya.
              </p>
              <div className="mt-6">
                <Link
                  href="/#program"
                  className="inline-flex items-center gap-2 rounded-full bg-[#012D1D] hover:bg-[#0B4A31] text-white px-6 py-2.5 sm:py-3 font-poppins font-semibold text-xs sm:text-sm shadow-md transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Bagian Program</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 lg:gap-8">
              {programs.map((item, idx) => {
                const imageSrc = resolveProgramImage(item.imageUrl, idx);
                const summaryText = stripHtml(item.summary || item.content);
                const href = `/program/${item.slug || item.id}`;
                const dateLabel = formatDateRange(item.publishDate, item.endDate);

                return (
                  <article
                    key={item.id}
                    className="flex flex-col justify-between rounded-xl sm:rounded-2xl bg-white border border-[#D1D8D2] hover:border-[#012D1D] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group min-w-0"
                  >
                    <div>
                      {/* Card Image */}
                      <Link
                        href={href}
                        className="relative block h-[110px] sm:h-[210px] lg:h-[230px] w-full overflow-hidden bg-[#F1F4F9] border-b border-black/5"
                      >
                        <Image
                          src={imageSrc}
                          alt={item.title}
                          fill
                          unoptimized
                          sizes="(max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Ongoing / Completed Status Pill */}
                        <span
                          className={`absolute top-2 right-2 sm:top-3 sm:right-3 inline-flex items-center gap-1 rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs font-bold shadow-sm backdrop-blur-sm ${
                            item.isOngoing
                              ? 'bg-[#012D1D]/90 text-[#80E478] border border-[#80E478]/30'
                              : 'bg-white/95 text-[#3D3D3D] border border-[#E5E2DC]'
                          }`}
                        >
                          {item.isOngoing ? (
                            <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                          ) : (
                            <Archive className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 text-[#E8801A]" />
                          )}
                          <span>{item.isOngoing ? 'Berjalan' : 'Selesai'}</span>
                        </span>
                      </Link>

                      {/* Card Body */}
                      <div className="p-2.5 sm:p-5 lg:p-6 pb-0 sm:pb-0">
                        {/* Category & Partnership Badges */}
                        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-2 sm:mb-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF4E8] text-[#B45309] border border-[#FDE3C7] px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-xs font-semibold max-w-full truncate">
                            <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 text-[#FC9634]" />
                            <span className="truncate">{item.category || 'Program Komunitas'}</span>
                          </span>

                          {item.partnership && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F5E9] text-[#012D1D] border border-[#CFE7CA] px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-xs font-semibold max-w-full truncate">
                              <Building className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 text-[#3B9734]" />
                              <span className="truncate">{item.partnership}</span>
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-poppins font-bold text-xs sm:text-lg lg:text-xl leading-snug text-[#012D1D] group-hover:text-[#FC9634] transition-colors line-clamp-2">
                          <Link href={href} className="focus:outline-none">
                            {item.title}
                          </Link>
                        </h3>

                        {/* Summary */}
                        <p className="font-poppins font-normal text-[11px] sm:text-sm leading-snug sm:leading-relaxed text-[#3D3D3D] mt-1.5 sm:mt-2.5 line-clamp-2 sm:line-clamp-3">
                          {summaryText || 'Program kolaborasi Teman Pilah dalam membangun ekosistem hijau bersama warga.'}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-2.5 sm:p-5 lg:p-6 pt-3 sm:pt-4 mt-2 sm:mt-3 border-t border-[#E5E2DC]/70 flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-[#616b5a] font-medium min-w-0 truncate">
                        <CalendarDays className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8c9685] shrink-0" />
                        <span className="truncate">{dateLabel}</span>
                      </span>

                      <Link
                        href={href}
                        className="inline-flex items-center gap-1 font-poppins font-semibold text-[11px] sm:text-sm text-[#012D1D] underline underline-offset-4 hover:text-[#FC9634] transition-colors shrink-0"
                      >
                        <span>Pelajari lebih lanjut</span>
                        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Bottom Back Navigation */}
          <div className="mt-10 sm:mt-14 pt-6 sm:pt-8 border-t border-[#E5E2DC] flex justify-center">
            <Link
              href="/#program"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#012D1D] px-6 py-2.5 sm:py-3 font-poppins font-semibold text-xs sm:text-base text-[#012D1D] hover:bg-[#012D1D] hover:text-white transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Bagian Program</span>
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
