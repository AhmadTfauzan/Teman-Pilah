import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, Building, BookOpen, Tag, ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { SafeImage } from '@/components/shared/SafeImage';
import { OutlineLeaf, ConcentricCircles } from '@/components/ui/DecorativeElements';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FALLBACK_PROGRAM_IMAGE = '/activity/Pengmas (1).jpeg';

type Props = {
  params: Promise<{ slug: string }>;
};

const envApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
const useEnvApiBase =
  Boolean(envApiUrl) &&
  !envApiUrl!.includes('trycloudflare.com') &&
  !envApiUrl!.includes('ngrok') &&
  !envApiUrl!.includes('localhost:2000');

function resolveProgramImageUrl(rawPath?: string | null): string | null {
  const path = rawPath?.trim();
  if (!path) return null;
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    (path.startsWith('/') && !path.startsWith('//'))
  ) {
    return path;
  }
  const cleanPath = path.replace(/^\/+/, '');
  return useEnvApiBase ? `${envApiUrl}/${cleanPath}` : `/${cleanPath}`;
}

export default async function DetailProgramPage({ params }: Props) {
  const { slug } = await params;

  let decodedSlug = slug;
  try {
    decodedSlug = decodeURIComponent(slug);
  } catch {
    decodedSlug = slug;
  }

  let program = null;

  try {
    program = await prisma.news.findFirst({
      where: {
        OR: [{ slug: decodedSlug }, { id: decodedSlug }],
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
      },
    });
  } catch (error) {
    console.error('Failed to fetch program details:', error);
  }

  if (!program) {
    notFound();
  }

  const dateFormatOpts: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  };

  const startDate = program.publishDate
    ? program.publishDate.toLocaleDateString('id-ID', dateFormatOpts)
    : '';
  const endDate = program.endDate
    ? program.endDate.toLocaleDateString('id-ID', dateFormatOpts)
    : '';
  const dateRange =
    startDate && endDate
      ? `${startDate} - ${endDate}`
      : startDate || 'Tanggal Belum Ditentukan';

  const imageUrl =
    resolveProgramImageUrl(program.imageUrl) ?? FALLBACK_PROGRAM_IMAGE;

  return (
    <div className="pt-20 md:pt-[88px] min-h-screen bg-[#FAFAF8] relative overflow-hidden">
      {/* Decorative Brand Accents (Figma Frame 48) */}
      <div className="absolute -right-24 top-24 opacity-20 pointer-events-none rotate-[20deg]">
        <OutlineLeaf size={340} color="#203220" strokeWidth={6.72} />
      </div>
      <div className="absolute -left-20 bottom-32 opacity-25 pointer-events-none">
        <ConcentricCircles size={300} color="#FC9634" />
      </div>
      <div className="max-w-[1440px] 2xl:px-12 mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 md:py-12">
        {/* BACK BUTTON */}
        <div className="mb-4 sm:mb-8">
          <Link
            href="/#program"
            className="inline-flex items-center text-xs sm:text-[14px] font-medium text-[#72796E] hover:text-[#2A3426] transition-colors"
          >
            <ArrowLeft size={16} className="mr-1.5 sm:mr-2" />
            Kembali ke Daftar Program
          </Link>
        </div>

        {/* TAGS */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-8">
          {program.tags && program.tags.length > 0 ? (
            program.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#e4f0e9] text-[#166534] rounded-md text-[10px] sm:text-[11px] font-bold tracking-wider uppercase"
              >
                <Tag className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {tag}
              </span>
            ))
          ) : (
            <span className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-[#e4f0e9] text-[#166534] rounded-md text-[10px] sm:text-[11px] font-bold tracking-wider uppercase">
              <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Edukasi
            </span>
          )}
        </div>

        {/* TITLE */}
        <h1 className="text-2xl sm:text-[32px] md:text-[40px] font-bold text-[#1a2f1d] leading-tight mb-4 sm:mb-6">
          {program.title}
        </h1>

        {/* METADATA */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-[14px] text-[#616b5a] font-medium mb-6 sm:mb-10">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            <span>{dateRange}</span>
          </div>
          {program.partnership && (
            <>
              <div className="hidden sm:block w-[1.5px] h-4 bg-[#d1d5db]"></div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                <span>{program.partnership}</span>
              </div>
            </>
          )}
        </div>

        {/* HERO IMAGE */}
        <div className="w-full aspect-[16/9] sm:aspect-[2.2/1] rounded-2xl sm:rounded-[24px] overflow-hidden mb-5 sm:mb-8 bg-[#e0e5db] relative shadow-sm">
          <SafeImage
            src={imageUrl}
            fallbackSrc={FALLBACK_PROGRAM_IMAGE}
            alt={program.title}
            className="w-full h-full object-cover opacity-90"
          />
        </div>

        {/* HIGHLIGHT BOX / SUMMARY */}
        {program.summary && (
          <div className="bg-[#f4f2ea] rounded-2xl sm:rounded-[24px] p-4 sm:p-6 md:p-8 mb-6 sm:mb-12 shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-[#ecebe1]">
            <p className="text-[#42493E] text-sm sm:text-[16px] md:text-[17px] leading-relaxed font-medium">
              {program.summary.replace(/<[^>]*>/g, '')}
            </p>
          </div>
        )}

        {/* BODY CONTENT */}
        <div className="text-[#42493E] text-sm sm:text-[15px] md:text-[16px] leading-[1.75] sm:leading-[1.8] tracking-wide relative">
          <style>{`
            .program-content ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin: 1rem 0 !important; }
            .program-content ol { list-style-type: decimal !important; padding-left: 1.5rem !important; margin: 1rem 0 !important; }
            .program-content blockquote { border-left: 4px solid #C2C9BB !important; padding-left: 1rem !important; color: #72796E !important; font-style: italic !important; margin: 1.5rem 0 !important; }
            .program-content a { color: #2D5A27 !important; text-decoration: underline !important; }
            .program-content p { margin-bottom: 1rem; }
            .program-content h1, .program-content h2, .program-content h3 { font-weight: bold; color: #1a2f1d; margin-top: 1.5rem; margin-bottom: 0.75rem; }
          `}</style>
          {program.content ? (
            <div className="program-content" dangerouslySetInnerHTML={{ __html: program.content }} />
          ) : (
            <p>Konten program belum tersedia.</p>
          )}
        </div>
      </div>
    </div>
  );
}
