import React from 'react';
import { notFound } from 'next/navigation';
import { CalendarDays, Link as LinkIcon, ArrowLeft } from 'lucide-react';
import { educationApi, getThumbnailUrl } from '@/lib/api/education';
import { DownloadPdfButton } from '@/components/landing/DownloadPdfButton';
import { OutlineLeaf, ConcentricCircles } from '@/components/ui/DecorativeElements';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function DynamicEducationDetail({ params }: PageProps) {
  const { slug } = await params;
  
  let content = null;
  try {
    const allEducation = await educationApi.getAll();
    content = allEducation.find((item) => item.slug === slug);
  } catch (error) {
    console.error('Failed to fetch education article:', error);
  }

  if (!content) {
    notFound();
  }

  const formattedDate = content.publishDate 
    ? new Date(content.publishDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : content.createdAt 
    ? new Date(content.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : '-';

  return (
    <div className="pt-20 md:pt-[88px] min-h-screen bg-[#FAFAF8] relative overflow-hidden">
      {/* Decorative Brand Accents (Figma Frame 48) */}
      <div className="absolute -right-24 top-28 opacity-20 pointer-events-none rotate-[20deg]">
        <OutlineLeaf size={340} color="#203220" strokeWidth={6.72} />
      </div>
      <div className="absolute -left-20 bottom-32 opacity-25 pointer-events-none">
        <ConcentricCircles size={300} color="#FC9634" />
      </div>
      {/* CONTAINED WRAPPER - Matches Navbar and Footer limits */}
      <div className="mx-auto max-w-[1440px] 2xl:px-12 px-4 sm:px-6 lg:px-8 py-5 sm:py-10 flex flex-col gap-4 sm:gap-8">
        
        {/* BACK BUTTON */}
        <div>
          <a
            href="/#edukasi"
            className="inline-flex items-center gap-2 text-xs sm:text-[15px] font-bold text-[#616b5a] hover:text-[#1a2f1d] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 sm:w-[18px] sm:h-[18px] transition-transform group-hover:-translate-x-1 text-[#616b5a] group-hover:text-[#1a2f1d]" />
            <span>Kembali ke Pusat Edukasi</span>
          </a>
        </div>

        {/* HERO IMAGE / THUMBNAIL - Aligned & Contained */}
        <div className="w-full h-[190px] sm:h-[250px] md:h-[480px] relative overflow-hidden bg-[#e0e5db] rounded-2xl sm:rounded-[32px] border border-[#e5e7e0] shadow-sm">
          {content.thumbnail ? (
            <img
              src={getThumbnailUrl(content.thumbnail)}
              alt={content.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=2000"
              alt="Edukasi Lingkungan"
              className="w-full h-full object-cover opacity-90"
            />
          )}
          <div className="absolute inset-0 bg-black/10 mix-blend-multiply"></div>
        </div>

        {/* ARTICLE CONTENT */}
        <div className="w-full px-0 py-2 sm:py-4 md:py-6">
          
          {/* TAGS */}
          {content.tags && content.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
              {content.tags.map((tag: string, index: number) => (
                <span key={index} className="px-3 py-1 sm:px-4 sm:py-1.5 bg-[#DCFCE7] text-[#166534] rounded-full text-xs sm:text-[13px] font-bold tracking-wide">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* TITLE */}
          <h1 className="text-2xl sm:text-[32px] md:text-[44px] font-extrabold text-[#1a2f1d] leading-tight mb-4 sm:mb-6">
            {content.title}
          </h1>

          {/* METADATA */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-[14px] text-[#616b5a] font-medium mb-6 sm:mb-10 pb-5 sm:pb-8 border-b border-[#e5e7e0]">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-[#8c9685] sm:w-[18px] sm:h-[18px]" />
              <span>Dipublikasikan pada: {formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <LinkIcon size={16} className="text-[#8c9685] sm:w-[18px] sm:h-[18px]" />
              <span className="break-all">temanpilah.com/edukasi/{content.slug}</span>
            </div>
          </div>

          {/* OVERVIEW */}
          {content.overview && (
            <div className="bg-[#E8F5E9] border-l-[4px] sm:border-l-[6px] border-[#1a2f1d] p-4 sm:p-6 md:p-8 mb-8 sm:mb-12 rounded-r-2xl">
              <p className="text-[#1a2f1d] font-bold text-[15px] sm:text-[18px] md:text-[20px] leading-relaxed italic">
                "{content.overview}"
              </p>
            </div>
          )}

          {/* BODY TEXT / RICH TEXT DESCRIPTION */}
          <div className="space-y-4 sm:space-y-6 text-[#42493E] text-sm sm:text-[16px] md:text-[17px] leading-[1.75] sm:leading-[1.8] tracking-wide editor-content">
            <style>{`
              .editor-content ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin: 1rem 0 !important; }
              .editor-content ol { list-style-type: decimal !important; padding-left: 1.5rem !important; margin: 1rem 0 !important; }
              .editor-content blockquote { border-left: 3px solid #C2C9BB !important; padding-left: 1rem !important; color: #72796E !important; font-style: italic !important; margin: 1rem 0 !important; }
              .editor-content a { color: #2D5A27 !important; text-decoration: underline !important; }
              .editor-content p { margin-bottom: 1.25rem !important; }
            `}</style>
            <div dangerouslySetInnerHTML={{ __html: content.description }} />
          </div>

          {/* BOTTOM BUTTON */}
          <div className="mt-8 sm:mt-14 mb-4 sm:mb-8">
            <DownloadPdfButton content={content} />
          </div>

        </div>
      </div>
    </div>
  );
}
