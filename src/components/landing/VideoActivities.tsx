'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { ChevronLeft, ChevronRight, Play, X, ArrowRight, ExternalLink, Video } from 'lucide-react';
import { ConcentricCircles, OutlineLeaf } from '@/components/ui/DecorativeElements';
import { BANK_SAMPAH_VIDEOS } from '@/data/bankSampahVideos';
import { BankSampahVideoItem } from '@/types';
import { getVideoThumbnailUrl } from '@/lib/api/video';

type DisplayVideoItem = Omit<BankSampahVideoItem, 'id' | 'platform'> & {
  id: string | number;
  platform: string;
};

interface VideoActivitiesProps {
  initialVideos?: BankSampahVideoItem[];
}

function isLocalVideoSource(videoUrl?: string | null, platform?: string | null): boolean {
  if (platform === 'Local') return true;
  const trimmed = videoUrl?.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true;
  const pathWithoutQuery = trimmed.split(/[?#]/)[0].toLowerCase();
  return pathWithoutQuery.endsWith('.mp4') || pathWithoutQuery.endsWith('.webm');
}

function extractYouTubeId(rawUrl?: string | null): string | null {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com' ||
      host === 'youtube-nocookie.com'
    ) {
      const vParam = parsed.searchParams.get('v');
      if (vParam && /^[a-zA-Z0-9_-]{11}$/.test(vParam)) {
        return vParam;
      }

      const segments = parsed.pathname.split('/').filter(Boolean);
      if (
        segments.length >= 2 &&
        ['embed', 'shorts', 'live', 'v'].includes(segments[0].toLowerCase())
      ) {
        const candidate = segments[1];
        return /^[a-zA-Z0-9_-]{11}$/.test(candidate) ? candidate : null;
      }
    }
  } catch {
    // Fallback regex below
  }

  const match = trimmed.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  return match ? match[1] : null;
}

function isSafeExternalVideoUrl(rawUrl?: string | null): boolean {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    (trimmed.startsWith('/') && !trimmed.startsWith('//'))
  );
}

function formatVideoDate(dateStr?: string | null, createdAt?: string | null): string {
  if (dateStr) return dateStr;
  if (!createdAt) return '';
  const parsed = new Date(createdAt);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
}

export function VideoActivities({ initialVideos }: VideoActivitiesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeVideo, setActiveVideo] = useState<DisplayVideoItem | null>(null);

  const displayVideos: DisplayVideoItem[] =
    initialVideos && initialVideos.length > 0 ? initialVideos : BANK_SAMPAH_VIDEOS;

  useEffect(() => {
    if (!activeVideo) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveVideo(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeVideo]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const step = typeof window !== 'undefined' && window.innerWidth < 640 ? 220 : 480;
    const scrollAmount = direction === 'left' ? -step : step;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'YouTube':
        return (
          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-600 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        );
      case 'TikTok':
        return (
          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-black fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
          </svg>
        );
      case 'Instagram':
        return (
          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-pink-600 fill-current shrink-0" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        );
      default:
        return <Video className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-700 shrink-0" />;
    }
  };

  return (
    <section
      id="bank-sampah"
      className="relative w-full overflow-hidden bg-[#012D1D] py-10 sm:py-16 lg:py-28"
    >
      {/* ─── DECORATIVE ACCENTS (Figma Frame 48) ─── */}
      <div className="hidden sm:block absolute -left-28 -top-24 opacity-30 pointer-events-none">
        <ConcentricCircles size={360} color="#0B4A31" />
      </div>
      <div className="hidden sm:block absolute -right-20 -bottom-24 opacity-25 pointer-events-none rotate-[30deg]">
        <OutlineLeaf size={380} color="#203220" strokeWidth={6.72} />
      </div>

      <Container className="relative z-10">
        {/* ─── HEADER ─── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-6 pb-5 sm:pb-10">
          <div>
            <h2 className="font-['Poppins'] font-bold text-2xl sm:text-4xl lg:text-[44px] leading-tight text-white tracking-[-0.5px] sm:tracking-[-1px]">
              Bank Sampah
            </h2>
            <p className="font-['Poppins'] font-normal text-xs sm:text-lg text-[#C9D6CF] mt-1 sm:mt-2 max-w-[640px]">
              Lihat langsung aksi dan kegiatan Bank Sampah Teman Pilah lewat video dari YouTube, Instagram,
              dan TikTok kami.
            </p>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4">
            {/* Scroll Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border border-white/20 bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Geser ke kiri"
              >
                <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border border-white/20 bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Geser ke kanan"
              >
                <ChevronRight size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            <Link
              href="/bank-sampah"
              className="font-['Poppins'] font-semibold text-xs sm:text-base text-white underline underline-offset-4 hover:text-[#FC9634] transition-colors whitespace-nowrap flex items-center gap-1.5 group"
            >
              <span>Lihat Semua</span>
              <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px] transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* ─── VIDEO CAROUSEL TRACK (Figma Layout) ─── */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-2.5 sm:gap-6 overflow-x-auto pb-3 sm:pb-6 pt-1 sm:pt-2 no-scrollbar scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayVideos.map((video) => {
            const isWide = video.aspect === 'wide';
            const displayDate = formatVideoDate(video.date, video.createdAt);
            return (
              <div
                key={video.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveVideo(video)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveVideo(video);
                  }
                }}
                className={`relative shrink-0 snap-start rounded-[10px] overflow-hidden bg-[#012D1D] border border-[#0B4A31] cursor-pointer group shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-[#FC9634] ${
                  isWide
                    ? 'w-[46%] min-w-[160px] sm:w-[420px] md:w-[600px] lg:w-[711px] h-[200px] sm:h-[340px] md:h-[400px]'
                    : 'w-[45%] min-w-[155px] sm:w-[225px] h-[200px] sm:h-[340px] md:h-[400px]'
                }`}
              >
                {/* Background Image */}
                <Image
                  src={getVideoThumbnailUrl(video.thumbnail)}
                  alt={video.title}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes={isWide ? '711px' : '225px'}
                />

                {/* Dark Gradient Overlay */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30 opacity-90 transition-opacity group-hover:opacity-75"
                />

                {/* Top Left: Platform Pill */}
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1 sm:gap-1.5 rounded-[6px] sm:rounded-[8px] bg-white px-1.5 py-0.5 sm:px-2.5 sm:py-1 shadow-md">
                  {getPlatformIcon(video.platform)}
                  <span className="font-['Poppins'] font-semibold text-[10px] sm:text-xs text-[#111111]">
                    {video.platform}
                  </span>
                </div>

                {/* Top Right: Duration Pill */}
                {video.duration && (
                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 rounded-[6px] sm:rounded-[8px] bg-black/70 px-1.5 py-0.5 sm:px-2 sm:py-1 shadow-md">
                    <span className="font-['Poppins'] font-medium text-[10px] sm:text-xs text-white">
                      {video.duration}
                    </span>
                  </div>
                )}

                {/* Center: Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-[#FC9634] group-hover:bg-[#e8801a] group-hover:scale-110 flex items-center justify-center text-[#012D1D] shadow-xl transition-all duration-300">
                    <Play className="w-4 h-4 sm:w-6 sm:h-6 fill-[#012D1D] ml-0.5 sm:ml-1" />
                  </div>
                </div>

                {/* Bottom Overlay: Title & Date */}
                <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-5 flex flex-col gap-0.5 sm:gap-1 bg-gradient-to-t from-black via-black/80 to-transparent">
                  <h3 className="font-['Poppins'] font-semibold text-xs sm:text-base text-white line-clamp-2 leading-snug drop-shadow-sm">
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-[#C9D6CF] font-['Poppins'] overflow-hidden whitespace-nowrap">
                    {displayDate && <span className="truncate">{displayDate}</span>}
                    {displayDate && <span className="hidden sm:inline">·</span>}
                    <span className="text-[#FC9634] hidden sm:inline">Tonton di {video.platform}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>

      {/* ─── VIDEO MODAL PREVIEW ─── */}
      {activeVideo && (() => {
        const modalIsLocal = isLocalVideoSource(activeVideo.videoUrl, activeVideo.platform);
        const modalYoutubeId = !modalIsLocal ? extractYouTubeId(activeVideo.videoUrl) : null;
        const isTallVideo =
          activeVideo.aspect === 'tall' ||
          activeVideo.videoUrl.toLowerCase().includes('/shorts/');
        const hasSafeExternalUrl = isSafeExternalVideoUrl(activeVideo.videoUrl);

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={activeVideo.title}
            onClick={(e) => {
              if (e.target === e.currentTarget) setActiveVideo(null);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md transition-opacity duration-200 overflow-y-auto"
          >
            <div className="relative w-full max-w-2xl rounded-2xl bg-[#012D1D] border border-[#0B4A31] p-4 sm:p-6 text-white shadow-2xl animate-pop my-auto">
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                aria-label="Tutup preview video"
                className="absolute top-4 right-4 rounded-full p-1.5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-2 mb-3 pr-8">
                <span className="rounded-md bg-white px-2 py-0.5 text-xs font-bold text-black">
                  {activeVideo.platform}
                </span>
                {activeVideo.duration && (
                  <span className="text-xs text-[#C9D6CF]">Durasi: {activeVideo.duration}</span>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-bold font-['Poppins'] mb-4 pr-8">
                {activeVideo.title}
              </h3>

              {modalIsLocal ? (
                <div
                  className={`relative rounded-xl overflow-hidden mb-4 border border-[#0B4A31] bg-black ${
                    isTallVideo
                      ? 'aspect-[9/16] max-h-[60vh] max-w-[340px] mx-auto'
                      : 'aspect-video w-full'
                  }`}
                >
                  <video
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                    src={activeVideo.videoUrl}
                  >
                    Browser Anda tidak mendukung pemutar video HTML5.
                  </video>
                </div>
              ) : modalYoutubeId ? (
                <div
                  className={`relative rounded-xl overflow-hidden mb-4 border border-[#0B4A31] bg-black ${
                    isTallVideo
                      ? 'aspect-[9/16] max-h-[60vh] max-w-[340px] mx-auto'
                      : 'aspect-video w-full'
                  }`}
                >
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${modalYoutubeId}?autoplay=1&rel=0`}
                    title={activeVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="relative h-64 sm:h-80 w-full rounded-xl overflow-hidden mb-5 border border-[#0B4A31]">
                  <Image
                    src={getVideoThumbnailUrl(activeVideo.thumbnail)}
                    alt={activeVideo.title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/45 flex items-center justify-center p-4">
                    {hasSafeExternalUrl && (
                      <a
                        href={activeVideo.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-[#FC9634] hover:bg-[#e8801a] px-6 py-3 font-bold text-[#012D1D] shadow-lg transition-transform hover:scale-105 active:scale-95"
                      >
                        <Play size={18} className="fill-[#012D1D]" />
                        <span>Buka Video di {activeVideo.platform}</span>
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {activeVideo.description && (
                <p className="text-xs sm:text-sm text-[#C9D6CF] font-['Poppins'] leading-relaxed mb-4">
                  {activeVideo.description}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2">
                {(modalIsLocal || modalYoutubeId) && hasSafeExternalUrl && (
                  <a
                    href={activeVideo.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors"
                  >
                    <span>Buka di {activeVideo.platform}</span>
                    <ExternalLink size={14} />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setActiveVideo(null)}
                  className="rounded-xl border border-white/20 px-5 py-2 text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </section>
  );
}

export default VideoActivities;
