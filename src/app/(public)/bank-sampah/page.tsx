'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
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

export default function BankSampahPage() {
  const [videoList, setVideoList] = useState<any[]>(BANK_SAMPAH_VIDEOS);
  const [selectedPlatform, setSelectedPlatform] = useState<'ALL' | VideoPlatform>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideo, setActiveVideo] = useState<any | null>(null);
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

  // Filtered videos based on platform & search query
  const filteredVideos = useMemo(() => {
    return videoList.filter((video) => {
      const matchPlatform =
        selectedPlatform === 'ALL' || video.platform === selectedPlatform;
      const matchSearch =
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (video.description && video.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (video.category && video.category.toLowerCase().includes(searchQuery.toLowerCase()));
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

  const getPlatformIcon = (platform: VideoPlatform, className = 'w-4 h-4') => {
    switch (platform) {
      case 'YouTube':
        return (
          <svg className={`${className} text-red-600 fill-current`} viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        );
      case 'TikTok':
        return (
          <svg className={`${className} text-black fill-current`} viewBox="0 0 24 24">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
          </svg>
        );
      case 'Instagram':
        return (
          <svg className={`${className} text-pink-600 fill-current`} viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        );
    }
  };

  const copyVideoLink = (video: any) => {
    navigator.clipboard.writeText(video.videoUrl);
    setCopiedId(video.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] text-[#1E293B]">
      {/* ─── HERO HEADER BANNER ─── */}
      <section className="relative overflow-hidden bg-[#012D1D] pt-28 sm:pt-32 pb-16 lg:pb-20 text-white">
        {/* Decorative Figma Accents */}
        <div className="absolute -left-28 -top-24 opacity-25 pointer-events-none">
          <ConcentricCircles size={360} color="#0B4A31" />
        </div>
        <div className="absolute -right-20 -bottom-24 opacity-25 pointer-events-none rotate-[30deg]">
          <OutlineLeaf size={400} color="#203220" strokeWidth={6.72} />
        </div>

        <Container className="relative z-10">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-[#C9D6CF] font-['Poppins'] mb-6">
            <Link href="/" className="hover:text-white transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <span className="text-[#FC9634] font-medium">Bank Sampah</span>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#0B4A31] border border-[#3B9734]/40 px-4 py-1.5 text-xs sm:text-sm font-semibold text-[#80E478] mb-4">
              <Video size={16} />
              <span>Dokumentasi & Video Sosmed Resmi</span>
            </div>

            <h1 className="font-['Poppins'] font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight text-white tracking-[-1px]">
              Bank Sampah Teman Pilah
            </h1>

            <p className="font-['Poppins'] font-normal text-base sm:text-lg text-[#C9D6CF] mt-3 leading-relaxed">
              Jelajahi seluruh video aksi penimbangan berkala, edukasi pemilahan sampah anorganik,
              dan kolaborasi masyarakat yang terintegrasi langsung dengan kanal resmi YouTube,
              Instagram, dan TikTok kami.
            </p>

            {/* Official Social Media Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-6">
              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-xs sm:text-sm font-medium text-white transition-all hover:scale-105"
              >
                {getPlatformIcon('YouTube')}
                <span>YouTube Resmi</span>
                <ExternalLink size={13} className="text-[#C9D6CF]" />
              </a>

              <a
                href="https://www.instagram.com/temanpilah"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-xs sm:text-sm font-medium text-white transition-all hover:scale-105"
              >
                {getPlatformIcon('Instagram')}
                <span>@temanpilah</span>
                <ExternalLink size={13} className="text-[#C9D6CF]" />
              </a>

              <a
                href="https://www.tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-xs sm:text-sm font-medium text-white transition-all hover:scale-105"
              >
                {getPlatformIcon('TikTok')}
                <span>TikTok Resmi</span>
                <ExternalLink size={13} className="text-[#C9D6CF]" />
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── FILTER & SEARCH TOOLBAR ─── */}
      <section className="sticky top-[76px] z-30 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] py-4 shadow-sm">
        <Container>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              <button
                onClick={() => setSelectedPlatform('ALL')}
                className={`rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  selectedPlatform === 'ALL'
                    ? 'bg-[#012D1D] text-white shadow-sm'
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                }`}
              >
                Semua Video ({stats.all})
              </button>

              <button
                onClick={() => setSelectedPlatform('YouTube')}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  selectedPlatform === 'YouTube'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                }`}
              >
                {getPlatformIcon('YouTube')}
                <span>YouTube ({stats.youtube})</span>
              </button>

              <button
                onClick={() => setSelectedPlatform('Instagram')}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  selectedPlatform === 'Instagram'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm'
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                }`}
              >
                {getPlatformIcon('Instagram')}
                <span>Instagram ({stats.instagram})</span>
              </button>

              <button
                onClick={() => setSelectedPlatform('TikTok')}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  selectedPlatform === 'TikTok'
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]'
                }`}
              >
                {getPlatformIcon('TikTok')}
                <span>TikTok ({stats.tiktok})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari video atau topik..."
                className="w-full rounded-full border border-gray-300 bg-[#F8FAF8] pl-10 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#3B9734] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3B9734]/20 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
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
      <section className="py-12 sm:py-16">
        <Container>
          {filteredVideos.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 text-[#012D1D] flex items-center justify-center mb-4">
                <Video size={32} />
              </div>
              <h3 className="font-bold text-xl text-gray-900 font-['Poppins']">
                Tidak ada video ditemukan
              </h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                Coba gunakan kata kunci pencarian yang lain atau ubah filter platform sosial media di atas.
              </p>
              <button
                onClick={() => {
                  setSelectedPlatform('ALL');
                  setSearchQuery('');
                }}
                className="mt-5 rounded-full bg-[#3B9734] hover:bg-[#2F8029] text-white px-5 py-2 text-sm font-semibold transition-colors shadow-md"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => setActiveVideo(video)}
                  className="group relative flex flex-col rounded-2xl bg-white border border-[#E2E8F0] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-900">
                    <Image
                      src={getVideoThumbnailUrl(video.thumbnail)}
                      alt={video.title}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20 opacity-80 group-hover:opacity-60 transition-opacity" />

                    {/* Platform Tag */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1 shadow-sm backdrop-blur-sm">
                      {getPlatformIcon(video.platform)}
                      <span className="font-['Poppins'] font-bold text-xs text-gray-900">
                        {video.platform}
                      </span>
                    </div>

                    {/* Duration Badge */}
                    <div className="absolute top-3 right-3 rounded-md bg-black/75 px-2 py-0.5 shadow-sm">
                      <span className="font-mono text-xs font-medium text-white flex items-center gap-1">
                        <Clock size={12} />
                        {video.duration}
                      </span>
                    </div>

                    {/* Center Play Button Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full bg-[#FC9634] group-hover:bg-[#e8801a] group-hover:scale-110 flex items-center justify-center text-[#012D1D] shadow-xl transition-all duration-300">
                        <Play size={20} className="fill-[#012D1D] ml-0.5" />
                      </div>
                    </div>

                    {/* Views & Category at bottom of thumbnail */}
                    {video.category && (
                      <div className="absolute bottom-3 left-3">
                        <span className="rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-medium text-[#C9D6CF] backdrop-blur-sm">
                          {video.category}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="font-['Poppins'] font-bold text-base text-gray-900 line-clamp-2 leading-snug group-hover:text-[#3B9734] transition-colors">
                        {video.title}
                      </h3>

                      {video.description && (
                        <p className="font-['Poppins'] text-xs text-gray-600 line-clamp-2 mt-2 leading-relaxed">
                          {video.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-['Poppins']">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} className="text-gray-400" />
                        {video.date}
                      </span>

                      <span className="text-[#3B9734] font-semibold flex items-center gap-1 group-hover:underline">
                        <span>Tonton</span>
                        <ExternalLink size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* ─── CALL TO ACTION: JADI NASABAH BANK SAMPAH ─── */}
      <section className="pb-20">
        <Container>
          <div className="relative rounded-3xl bg-gradient-to-r from-[#012D1D] to-[#0B4A31] p-8 sm:p-12 text-white overflow-hidden shadow-2xl">
            <div className="absolute -right-20 -bottom-20 opacity-20 pointer-events-none rotate-[20deg]">
              <OutlineLeaf size={320} color="#203220" strokeWidth={6} />
            </div>

            <div className="relative z-10 max-w-2xl">
              <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-[#FC9634]">
                Aksi Kolektif Warga
              </span>
              <h2 className="font-['Poppins'] font-bold text-2xl sm:text-3xl lg:text-4xl mt-2 leading-tight">
                Ingin Ikut Menjadi Nasabah Bank Sampah Teman Pilah?
              </h2>
              <p className="font-['Poppins'] text-sm sm:text-base text-[#C9D6CF] mt-3 leading-relaxed">
                Mulai pilah sampah anorganik dari rumah sekarang. Bawa ke pos penimbangan kami,
                kumpulkan saldo tabungan, dan tukarkan dengan sembako atau manfaat ekonomi lainnya!
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4">
                <a
                  href="https://wa.me/6281234567890?text=Halo%20Admin%20Teman%20Pilah,%20saya%20ingin%20mendaftar%20menjadi%20nasabah%20Bank%20Sampah"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#FC9634] hover:bg-[#e8801a] px-6 py-3 font-['Poppins'] font-bold text-sm text-[#012D1D] shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  <span>Daftar Jadi Nasabah via WhatsApp</span>
                </a>

                <Link
                  href="/#bank-sampah"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-3 font-['Poppins'] font-semibold text-sm text-white transition-colors"
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
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl rounded-2xl bg-[#012D1D] border border-[#0B4A31] p-6 text-white shadow-2xl">
            {/* Close Button */}
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 rounded-full p-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Tutup preview video"
            >
              <X size={20} />
            </button>

            {/* Platform & Duration Tags */}
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-xs font-bold text-black shadow-sm">
                {getPlatformIcon(activeVideo.platform)}
                <span>{activeVideo.platform}</span>
              </span>

              <span className="text-xs text-[#C9D6CF] flex items-center gap-1">
                <Clock size={13} />
                <span>Durasi: {activeVideo.duration}</span>
              </span>

              {activeVideo.category && (
                <span className="text-xs text-[#80E478] font-medium bg-[#0B4A31] px-2.5 py-0.5 rounded-full border border-[#3B9734]/30">
                  {activeVideo.category}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-lg sm:text-xl font-bold font-['Poppins'] mb-3 pr-8 leading-snug">
              {activeVideo.title}
            </h3>

            {/* Thumbnail Player Box */}
            <div className="relative h-60 sm:h-80 w-full rounded-xl overflow-hidden mb-4 border border-[#0B4A31]">
              <Image
                src={getVideoThumbnailUrl(activeVideo.thumbnail)}
                alt={activeVideo.title}
                fill
                unoptimized
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-6 text-center">
                <div className="h-16 w-16 rounded-full bg-[#FC9634] flex items-center justify-center text-[#012D1D] shadow-2xl mb-4 transition-transform hover:scale-110">
                  <Play size={28} className="fill-[#012D1D] ml-1" />
                </div>

                <a
                  href={activeVideo.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#FC9634] hover:bg-[#e8801a] px-6 py-3 font-['Poppins'] font-bold text-sm text-[#012D1D] shadow-lg transition-transform hover:scale-105 active:scale-95"
                >
                  <Play size={16} className="fill-[#012D1D]" />
                  <span>Buka & Tonton di {activeVideo.platform}</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Description */}
            {activeVideo.description && (
              <p className="text-xs sm:text-sm text-[#C9D6CF] font-['Poppins'] leading-relaxed mb-4">
                {activeVideo.description}
              </p>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#0B4A31]">
              <button
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

              <button
                onClick={() => setActiveVideo(null)}
                className="rounded-xl border border-white/20 px-5 py-2 text-xs sm:text-sm font-semibold hover:bg-white/10 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

