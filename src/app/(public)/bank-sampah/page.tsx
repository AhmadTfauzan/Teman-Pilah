'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { SafeImage } from '@/components/shared/SafeImage';
import {
  ChevronLeft,
  Play,
  X,
  Search,
  ExternalLink,
  Share2,
  Check,
  Calendar,
  Clock,
  Video,
} from 'lucide-react';
import { ConcentricCircles, OutlineLeaf } from '@/components/ui/DecorativeElements';
import { BANK_SAMPAH_VIDEOS, VideoPlatform } from '@/data/bankSampahVideos';
import { videoApi, getVideoThumbnailUrl } from '@/lib/api/video';
import { BankSampahVideoItem } from '@/types';

type DisplayBankSampahVideo = Omit<BankSampahVideoItem, 'id' | 'platform'> & {
  id: string | number;
  platform: string;
};

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

export default function BankSampahPage() {
  const [videoList, setVideoList] = useState<DisplayBankSampahVideo[]>(BANK_SAMPAH_VIDEOS);
  const [selectedPlatform, setSelectedPlatform] = useState<'ALL' | VideoPlatform>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState<DisplayBankSampahVideo | null>(null);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  useEffect(() => {
    videoApi
      .getAll({ limit: 100 })
      .then((data) => {
        if (data && data.length > 0) {
          setVideoList(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load bank sampah videos from API:', err);
      });
  }, []);

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

  // Filtered videos based on platform & search query
  const filteredVideos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return videoList.filter((video) => {
      const matchPlatform =
        selectedPlatform === 'ALL' || video.platform === selectedPlatform;
      const matchSearch =
        !q ||
        video.title.toLowerCase().includes(q) ||
        (video.description ? video.description.toLowerCase().includes(q) : false) ||
        (video.category ? video.category.toLowerCase().includes(q) : false);
      return matchPlatform && matchSearch;
    });
  }, [videoList, selectedPlatform, searchQuery]);

  // Platform count stats
  const stats = useMemo(() => {
    return {
      all: videoList.length,
      youtube: videoList.filter((v) => v.platform === 'YouTube').length,
      instagram: videoList.filter((v) => v.platform === 'Instagram').length,
      tiktok: videoList.filter((v) => v.platform === 'TikTok').length,
    };
  }, [videoList]);

  const getPlatformIcon = (platform: string, className = 'w-4 h-4') => {
    switch (platform) {
      case 'YouTube':
        return (
          <svg className={`${className} text-red-600 fill-current`} viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        );
      case 'TikTok':
        return (
          <svg className={`${className} text-black fill-current`} viewBox="0 0 24 24">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
          </svg>
        );
      case 'Instagram':
        return (
          <svg className={`${className} text-pink-600 fill-current`} viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        );
      default:
        return <Video className={`${className} text-emerald-700`} />;
    }
  };

  const copyVideoLink = async (video: DisplayBankSampahVideo) => {
    try {
      await navigator.clipboard.writeText(video.videoUrl);
      setCopiedId(video.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#1E293B]">
      {/* ─── HERO HEADER BANNER ─── */}
      <section className="relative overflow-hidden bg-[#012D1D] pt-20 pb-8 sm:pt-32 sm:pb-14 lg:pb-20 text-white">
        {/* Decorative Figma Accents */}
        <div className="absolute -left-28 -top-24 opacity-25 pointer-events-none">
          <ConcentricCircles size={360} color="#0B4A31" />
        </div>
        <div className="absolute -right-20 -bottom-24 opacity-25 pointer-events-none rotate-[30deg]">
          <OutlineLeaf size={400} color="#203220" strokeWidth={6.72} />
        </div>

        <Container className="relative z-10">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#C9D6CF] font-['Poppins'] mb-3 sm:mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <span className="text-[#FC9634] font-medium">Bank Sampah</span>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-[#0B4A31] border border-[#3B9734]/40 px-3 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-sm font-semibold text-[#80E478] mb-2.5 sm:mb-4">
              <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Dokumentasi &amp; Video Sosmed Resmi</span>
            </div>

            <h1 className="font-['Poppins'] font-bold text-2xl sm:text-4xl lg:text-5xl leading-tight text-white tracking-[-0.5px] sm:tracking-[-1px]">
              Bank Sampah Teman Pilah
            </h1>

            <p className="font-['Poppins'] font-normal text-xs sm:text-lg text-[#C9D6CF] mt-2 sm:mt-3 leading-relaxed">
              Jelajahi seluruh video aksi penimbangan berkala, edukasi pemilahan sampah anorganik,
              dan kolaborasi masyarakat yang terintegrasi langsung dengan kanal resmi YouTube,
              Instagram, dan TikTok kami.
            </p>

            {/* Official Social Media Badges */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-4 sm:pt-6">
              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm font-medium text-white transition-all hover:scale-105"
              >
                {getPlatformIcon('YouTube', 'w-3.5 h-3.5 sm:w-4 sm:h-4')}
                <span>YouTube Resmi</span>
                <ExternalLink size={12} className="text-[#C9D6CF]" />
              </a>

              <a
                href="https://www.instagram.com/temanpilah"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm font-medium text-white transition-all hover:scale-105"
              >
                {getPlatformIcon('Instagram', 'w-3.5 h-3.5 sm:w-4 sm:h-4')}
                <span>@temanpilah</span>
                <ExternalLink size={12} className="text-[#C9D6CF]" />
              </a>

              <a
                href="https://www.tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm font-medium text-white transition-all hover:scale-105"
              >
                {getPlatformIcon('TikTok', 'w-3.5 h-3.5 sm:w-4 sm:h-4')}
                <span>TikTok Resmi</span>
                <ExternalLink size={12} className="text-[#C9D6CF]" />
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── FILTER & SEARCH TOOLBAR ─── */}
      <section className="sticky top-14 md:top-[76px] z-30 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] py-2.5 sm:py-4 shadow-sm">
        <Container>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4">
            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 md:pb-0 no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setSelectedPlatform('ALL')}
                className={`rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  selectedPlatform === 'ALL'
                    ? 'bg-[#012D1D] text-white shadow-sm'
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                }`}
              >
                Semua Video ({stats.all})
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlatform('YouTube')}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  selectedPlatform === 'YouTube'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                }`}
              >
                {getPlatformIcon('YouTube', 'w-3.5 h-3.5 sm:w-4 sm:h-4')}
                <span>YouTube ({stats.youtube})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlatform('Instagram')}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  selectedPlatform === 'Instagram'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm'
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                }`}
              >
                {getPlatformIcon('Instagram', 'w-3.5 h-3.5 sm:w-4 sm:h-4')}
                <span>Instagram ({stats.instagram})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPlatform('TikTok')}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  selectedPlatform === 'TikTok'
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                }`}
              >
                {getPlatformIcon('TikTok', 'w-3.5 h-3.5 sm:w-4 sm:h-4')}
                <span>TikTok ({stats.tiktok})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search
                className="w-4 h-4 sm:w-[18px] sm:h-[18px] absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari video atau topik..."
                className="w-full rounded-full border border-gray-300 bg-[#F8FAF8] pl-9 sm:pl-10 pr-8 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#3B9734] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B9734]/20 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Hapus pencarian"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ─── VIDEO GRID ─── */}
      <section className="py-6 sm:py-12 lg:py-16">
        <Container>
          {filteredVideos.length === 0 ? (
            <div className="text-center py-14 sm:py-20 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
              <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 text-[#012D1D] flex items-center justify-center mb-3 sm:mb-4">
                <Video className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 className="font-bold text-lg sm:text-xl text-gray-900 font-['Poppins']">
                Tidak ada video ditemukan
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
                Coba gunakan kata kunci pencarian yang lain atau ubah filter platform sosial media di atas.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedPlatform('ALL');
                  setSearchQuery('');
                }}
                className="mt-4 sm:mt-5 rounded-full bg-[#3B9734] hover:bg-[#2F8029] text-white px-5 py-2 text-xs sm:text-sm font-semibold transition-colors shadow-md"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 lg:gap-8">
              {filteredVideos.map((video) => {
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
                    className="group relative flex flex-col rounded-xl sm:rounded-2xl bg-white border border-[#E2E8F0] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer min-w-0 text-left focus:outline-none focus:ring-2 focus:ring-[#3B9734]"
                  >
                    {/* Thumbnail Container */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-900">
                      <SafeImage
                        src={getVideoThumbnailUrl(video.thumbnail)}
                        fallbackSrc="/activity/Pengmas (1).jpeg"
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20 opacity-80 group-hover:opacity-60 transition-opacity" />

                      {/* Platform Tag */}
                      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1 sm:gap-1.5 rounded sm:rounded-md bg-white/95 px-1.5 py-0.5 sm:px-2.5 sm:py-1 shadow-sm backdrop-blur-sm">
                        {getPlatformIcon(video.platform, 'w-3 h-3 sm:w-4 sm:h-4')}
                        <span className="font-['Poppins'] font-bold text-[9px] sm:text-xs text-gray-900">
                          {video.platform}
                        </span>
                      </div>

                      {/* Duration Badge */}
                      {video.duration && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 rounded sm:rounded-md bg-black/75 px-1.5 py-0.5 sm:px-2 shadow-sm">
                          <span className="font-mono text-[9px] sm:text-xs font-medium text-white flex items-center gap-0.5 sm:gap-1">
                            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            {video.duration}
                          </span>
                        </div>
                      )}

                      {/* Center Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-full bg-[#FC9634] group-hover:bg-[#e8801a] group-hover:scale-110 flex items-center justify-center text-[#012D1D] shadow-xl transition-all duration-300">
                          <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-[#012D1D] ml-0.5" />
                        </div>
                      </div>

                      {/* Views & Category at bottom of thumbnail */}
                      {video.category && (
                        <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 max-w-[calc(100%-1rem)]">
                          <span className="inline-block truncate max-w-full rounded-full bg-black/60 px-1.5 py-0.5 sm:px-2.5 text-[9px] sm:text-[11px] font-medium text-[#C9D6CF] backdrop-blur-sm">
                            {video.category}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Body Content */}
                    <div className="p-2.5 sm:p-5 flex flex-col flex-1 justify-between">
                      <div>
                        <h3 className="font-['Poppins'] font-bold text-xs sm:text-base text-gray-900 line-clamp-2 leading-snug group-hover:text-[#3B9734] transition-colors">
                          {video.title}
                        </h3>

                        {video.description && (
                          <p className="hidden sm:block font-['Poppins'] text-xs text-gray-600 line-clamp-2 mt-2 leading-relaxed">
                            {video.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 sm:pt-4 mt-2 sm:mt-4 border-t border-gray-100 flex items-center justify-between gap-1 text-[10px] sm:text-xs text-gray-500 font-['Poppins']">
                        <span className="flex items-center gap-1 min-w-0 truncate">
                          <Calendar className="w-3 h-3 sm:w-[13px] sm:h-[13px] text-gray-400 shrink-0" />
                          <span className="truncate">{displayDate || 'Terbaru'}</span>
                        </span>

                        <span className="text-[#3B9734] font-semibold flex items-center gap-0.5 sm:gap-1 group-hover:underline shrink-0">
                          <span>Tonton</span>
                          <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Container>
      </section>

      {/* ─── CALL TO ACTION: JADI NASABAH BANK SAMPAH ─── */}
      <section className="pb-12 sm:pb-20">
        <Container>
          <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#012D1D] to-[#0B4A31] p-5 sm:p-12 text-white overflow-hidden shadow-2xl">
            <div className="absolute -right-20 -bottom-20 opacity-20 pointer-events-none rotate-[20deg]">
              <OutlineLeaf size={320} color="#203220" strokeWidth={6} />
            </div>

            <div className="relative z-10 max-w-2xl">
              <span className="text-[11px] sm:text-sm font-bold tracking-widest uppercase text-[#FC9634]">
                Aksi Kolektif Warga
              </span>
              <h2 className="font-['Poppins'] font-bold text-xl sm:text-3xl lg:text-4xl mt-1.5 sm:mt-2 leading-tight">
                Ingin Ikut Menjadi Nasabah Bank Sampah Teman Pilah?
              </h2>
              <p className="font-['Poppins'] text-xs sm:text-base text-[#C9D6CF] mt-2 sm:mt-3 leading-relaxed">
                Mulai pilah sampah anorganik dari rumah sekarang. Bawa ke pos penimbangan kami,
                kumpulkan saldo tabungan, dan tukarkan dengan sembako atau manfaat ekonomi lainnya!
              </p>

              <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2.5 sm:gap-4">
                <a
                  href="https://wa.me/6281234567890?text=Halo%20Admin%20Teman%20Pilah,%20saya%20ingin%20mendaftar%20menjadi%20nasabah%20Bank%20Sampah"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#FC9634] hover:bg-[#e8801a] px-4 sm:px-6 py-2.5 sm:py-3 font-['Poppins'] font-bold text-xs sm:text-sm text-[#012D1D] shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  <span>Daftar Jadi Nasabah via WhatsApp</span>
                </a>

                <Link
                  href="/#bank-sampah"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-4 sm:px-5 py-2.5 sm:py-3 font-['Poppins'] font-semibold text-xs sm:text-sm text-white transition-colors"
                >
                  <ChevronLeft size={16} />
                  <span>Kembali ke Beranda</span>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── VIDEO MODAL PLAYER & PREVIEW ─── */}
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
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="absolute top-4 right-4 rounded-full p-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Tutup preview video"
              >
                <X size={20} />
              </button>

              {/* Platform & Duration Tags */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 pr-9">
                <span className="inline-flex items-center gap-1 rounded-md bg-white px-2 sm:px-2.5 py-0.5 sm:py-1 text-[11px] sm:text-xs font-bold text-black shadow-sm">
                  {getPlatformIcon(activeVideo.platform)}
                  <span>{activeVideo.platform}</span>
                </span>

                {activeVideo.duration && (
                  <span className="text-[11px] sm:text-xs text-[#C9D6CF] flex items-center gap-1">
                    <Clock size={13} />
                    <span>Durasi: {activeVideo.duration}</span>
                  </span>
                )}

                {activeVideo.category && (
                  <span className="text-[11px] sm:text-xs text-[#80E478] font-medium bg-[#0B4A31] px-2.5 py-0.5 rounded-full border border-[#3B9734]/30">
                    {activeVideo.category}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-base sm:text-xl font-bold font-['Poppins'] mb-3 pr-8 leading-snug">
                {activeVideo.title}
              </h3>

              {/* Embedded Player or Thumbnail Fallback */}
              {modalIsLocal ? (
                <div
                  className={`relative rounded-xl overflow-hidden mb-3 sm:mb-4 border border-[#0B4A31] bg-black ${
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
                  className={`relative rounded-xl overflow-hidden mb-3 sm:mb-4 border border-[#0B4A31] bg-black ${
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
                <div className="relative h-48 sm:h-80 w-full rounded-xl overflow-hidden mb-3 sm:mb-4 border border-[#0B4A31]">
                  <SafeImage
                    src={getVideoThumbnailUrl(activeVideo.thumbnail)}
                    fallbackSrc="/activity/Pengmas (1).jpeg"
                    alt={activeVideo.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-[#FC9634] flex items-center justify-center text-[#012D1D] shadow-2xl mb-3 sm:mb-4 transition-transform hover:scale-110">
                      <Play className="w-5 h-5 sm:w-7 sm:h-7 fill-[#012D1D] ml-0.5 sm:ml-1" />
                    </div>

                    {hasSafeExternalUrl && (
                      <a
                        href={activeVideo.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full bg-[#FC9634] hover:bg-[#e8801a] px-4 sm:px-6 py-2.5 sm:py-3 font-['Poppins'] font-bold text-xs sm:text-sm text-[#012D1D] shadow-lg transition-transform hover:scale-105 active:scale-95"
                      >
                        <Play size={15} className="fill-[#012D1D]" />
                        <span>Buka &amp; Tonton di {activeVideo.platform}</span>
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              {activeVideo.description && (
                <p className="text-xs sm:text-sm text-[#C9D6CF] font-['Poppins'] leading-relaxed mb-4">
                  {activeVideo.description}
                </p>
              )}

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#0B4A31]">
                <button
                  type="button"
                  onClick={() => copyVideoLink(activeVideo)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#C9D6CF] hover:text-white transition-colors"
                >
                  {copiedId === activeVideo.id ? (
                    <>
                      <Check size={14} className="text-[#80E478]" />
                      <span className="text-[#80E478]">Tautan disalin!</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={14} />
                      <span>Salin Tautan Video</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  {(modalIsLocal || modalYoutubeId) && hasSafeExternalUrl && (
                    <a
                      href={activeVideo.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
                    >
                      <span>Buka di {activeVideo.platform}</span>
                      <ExternalLink size={13} />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveVideo(null)}
                    className="rounded-xl border border-white/20 px-5 py-2 text-xs sm:text-sm font-semibold hover:bg-white/10 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
