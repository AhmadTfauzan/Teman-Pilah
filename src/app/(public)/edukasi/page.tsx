import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Clock, Sparkles } from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { ConcentricCircles, OutlineLeaf } from '@/components/ui/DecorativeElements';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Pusat Edukasi | Teman Pilah',
  description:
    'Kumpulan artikel dan panduan edukasi pengelolaan sampah, prinsip 3R & 5R, bank sampah, serta gaya hidup berkelanjutan bersama Teman Pilah.',
};

interface EducationCardItem {
  id: string;
  title: string;
  slug: string;
  overview: string;
  description: string;
  thumbnail: string | null;
  tags: string[];
  publishDate: Date | null;
  createdAt: Date;
  isFeaturedStatic?: boolean;
}

const FALLBACK_EDUCATION_IMAGES = [
  '/activity/Pengmas (7).jpeg',
  '/activity/Pengmas (8).jpeg',
  '/activity/Pengmas (9).jpeg',
  '/activity/Pengmas (10).jpeg',
];

const FEATURED_PRINSIP_3R: EducationCardItem = {
  id: 'featured-prinsip-3r',
  title: 'Prinsip 3R: Kunci Gaya Hidup Berkelanjutan',
  slug: 'prinsip-3r',
  overview:
    'Prinsip 3R (Reduce, Reuse, Recycle) adalah landasan utama dalam pengelolaan sampah yang efektif dan berkelanjutan untuk menjaga kelestarian ekosistem bumi kita.',
  description:
    'Panduan lengkap menerapkan strategi Reduce, Reuse, dan Recycle dalam aktivitas rumah tangga sehari-hari untuk mengurangi timbulan sampah ke TPA.',
  thumbnail: '/activity/Pengmas (7).jpeg',
  tags: ['Daur Ulang', 'Edukasi', 'Lingkungan'],
  publishDate: new Date('2024-05-12T00:00:00.000Z'),
  createdAt: new Date('2024-05-12T00:00:00.000Z'),
  isFeaturedStatic: true,
};

function resolveEducationImage(thumbnail: string | null | undefined, index: number): string {
  const fallback = FALLBACK_EDUCATION_IMAGES[index % FALLBACK_EDUCATION_IMAGES.length];
  if (!thumbnail) return fallback;

  const trimmed = thumbnail.trim();
  if (!trimmed) return fallback;

  if (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }

  // Fallback to local asset if stored thumbnail is a non-rooted relative path
  return fallback;
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function estimateReadMinutes(text: string): number {
  const plain = stripHtml(text);
  if (!plain) return 4;
  const words = plain.split(' ').filter(Boolean).length;
  return Math.max(3, Math.ceil(words / 180));
}

function formatIndonesianDate(date: Date | null | undefined): string {
  if (!date) return 'Terbaru';
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default async function EducationIndexPage() {
  let dbArticles: EducationCardItem[] = [];

  try {
    const records = await prisma.educationContent.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishDate: 'desc' },
    });

    dbArticles = records.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      overview: item.overview,
      description: item.description,
      thumbnail: item.thumbnail,
      tags: item.tags,
      publishDate: item.publishDate,
      createdAt: item.createdAt,
    }));
  } catch (error) {
    console.error('Failed to fetch education articles from database:', error);
  }

  const sortedDbArticles = [...dbArticles].sort((a, b) => {
    const timeA = (a.publishDate ?? a.createdAt).getTime();
    const timeB = (b.publishDate ?? b.createdAt).getTime();
    return timeB - timeA;
  });

  const hasPrinsip3R = sortedDbArticles.some((item) => item.slug === FEATURED_PRINSIP_3R.slug);
  const articles: EducationCardItem[] = hasPrinsip3R
    ? sortedDbArticles
    : [...sortedDbArticles, FEATURED_PRINSIP_3R];

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#3D3D3D]">
      {/* ─── HERO HEADER BANNER ─── */}
      <section className="relative overflow-hidden bg-[#012D1D] pt-20 pb-10 sm:pt-32 sm:pb-16 lg:pb-20 text-white">
        <div className="absolute -left-24 -top-24 opacity-25 pointer-events-none">
          <ConcentricCircles size={360} color="#0B4A31" />
        </div>
        <div className="hidden sm:block absolute -right-20 -bottom-24 opacity-25 pointer-events-none rotate-[25deg]">
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
            <Link href="/#edukasi" className="hover:text-white transition-colors">
              Pusat Edukasi
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#FC9634] font-semibold">Semua Artikel</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-[#0B4A31] border border-[#3B9734]/40 px-3 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-sm font-semibold text-[#80E478] mb-3 sm:mb-4">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Literasi &amp; Panduan Pengelolaan Sampah</span>
            </div>

            <h1 className="font-poppins font-bold text-2xl sm:text-4xl lg:text-5xl leading-tight text-white tracking-[-0.5px] sm:tracking-[-1px]">
              Pusat Edukasi <span className="text-[#FC9634]">Teman Pilah</span>
            </h1>

            <p className="font-poppins font-normal text-xs sm:text-lg text-[#C9D6CF] mt-2 sm:mt-3 leading-relaxed">
              Pahami cara memilah sampah dengan benar, praktik prinsip 3R &amp; 5R, hingga inovasi
              daur ulang untuk membangun lingkungan yang bersih dan berkelanjutan.
            </p>

            <div className="pt-4 sm:pt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/#edukasi"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Kembali ke Beranda</span>
              </Link>

              <span className="inline-flex items-center gap-2 rounded-full bg-[#FC9634]/15 border border-[#FC9634]/40 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#FC9634]">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{articles.length} Artikel Tersedia</span>
              </span>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── ARTICLES GRID ─── */}
      <section className="relative py-8 sm:py-14 lg:py-20 overflow-hidden">
        <div className="hidden sm:block absolute -right-24 top-16 opacity-20 pointer-events-none">
          <ConcentricCircles size={320} color="#FC9634" />
        </div>

        <Container className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-5 sm:pb-10 border-b border-[#E5E2DC] mb-6 sm:mb-10">
            <div>
              <h2 className="font-poppins font-bold text-lg sm:text-2xl lg:text-3xl text-[#012D1D]">
                Semua Artikel Edukasi
              </h2>
              <p className="font-poppins text-xs sm:text-base text-[#3D3D3D] mt-1">
                Pilih topik bacaan untuk memperdalam pengetahuan pengelolaan limbah rumah tangga.
              </p>
            </div>
            <span className="font-poppins text-xs sm:text-sm font-semibold text-[#012D1D] bg-[#E8F5E9] border border-[#CFE7CA] px-3 py-1.5 rounded-full self-start sm:self-auto">
              Menampilkan {articles.length} artikel
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 lg:gap-8">
            {articles.map((item, idx) => {
              const imageSrc = resolveEducationImage(item.thumbnail, idx);
              const summaryText = stripHtml(item.overview || item.description);
              const readMinutes = item.isFeaturedStatic ? 5 : estimateReadMinutes(item.description);
              const displayTags = item.tags && item.tags.length > 0 ? item.tags : ['Edukasi'];
              const href = `/edukasi/${item.slug}`;

              return (
                <article
                  key={item.id}
                  className="flex flex-col justify-between rounded-xl sm:rounded-2xl bg-white border border-[#D1D8D2] hover:border-[#012D1D] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden group min-w-0"
                >
                  <div>
                    {/* Card Thumbnail */}
                    <Link
                      href={href}
                      className="relative block h-[110px] sm:h-[200px] lg:h-[220px] w-full overflow-hidden bg-[#F1F4F9] border-b border-black/5"
                    >
                      <Image
                        src={imageSrc}
                        alt={item.title}
                        fill
                        unoptimized
                        sizes="(max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {item.isFeaturedStatic && (
                        <span className="absolute top-2 left-2 sm:top-3 sm:left-3 inline-flex items-center gap-1 rounded-full bg-[#FC9634] px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs font-bold text-[#012D1D] shadow-sm">
                          <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                          <span>Unggulan</span>
                        </span>
                      )}
                    </Link>

                    {/* Card Content */}
                    <div className="p-2.5 sm:p-5 lg:p-6 pb-0 sm:pb-0">
                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mb-2 sm:mb-3">
                        {displayTags.slice(0, 3).map((tag, tagIdx) => (
                          <span
                            key={`${item.id}-tag-${tagIdx}`}
                            className={`${
                              tagIdx >= 2 ? 'hidden sm:inline-flex' : 'inline-flex'
                            } items-center rounded-full bg-[#DCFCE7] text-[#166534] px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-xs font-semibold max-w-full truncate`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Title */}
                      <h3 className="font-poppins font-bold text-xs sm:text-lg lg:text-xl leading-snug text-[#012D1D] group-hover:text-[#FC9634] transition-colors line-clamp-2">
                        <Link href={href} className="focus:outline-none">
                          {item.title}
                        </Link>
                      </h3>

                      {/* Overview */}
                      <p className="font-poppins font-normal text-[11px] sm:text-sm leading-snug sm:leading-relaxed text-[#3D3D3D] mt-1.5 sm:mt-2.5 line-clamp-2 sm:line-clamp-3">
                        {summaryText || 'Materi edukasi pengelolaan sampah dan pelestarian lingkungan dari Teman Pilah.'}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-2.5 sm:p-5 lg:p-6 pt-3 sm:pt-4 mt-2 sm:mt-3 border-t border-[#E5E2DC]/70 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-[#616b5a] font-medium min-w-0">
                      <span className="inline-flex items-center gap-1 truncate">
                        <CalendarDays className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8c9685] shrink-0" />
                        <span className="truncate">{formatIndonesianDate(item.publishDate ?? item.createdAt)}</span>
                      </span>
                      <span className="hidden sm:inline-flex items-center gap-1 shrink-0">
                        <Clock className="w-3.5 h-3.5 text-[#8c9685] shrink-0" />
                        <span>{readMinutes} mnt</span>
                      </span>
                    </div>

                    <Link
                      href={href}
                      className="inline-flex items-center gap-1 font-poppins font-semibold text-[11px] sm:text-sm text-[#012D1D] underline underline-offset-4 hover:text-[#FC9634] transition-colors shrink-0"
                    >
                      <span>Baca artikel</span>
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Bottom Back Navigation */}
          <div className="mt-10 sm:mt-14 pt-6 sm:pt-8 border-t border-[#E5E2DC] flex justify-center">
            <Link
              href="/#edukasi"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#012D1D] px-6 py-2.5 sm:py-3 font-poppins font-semibold text-xs sm:text-base text-[#012D1D] hover:bg-[#012D1D] hover:text-white transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Bagian Edukasi</span>
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
