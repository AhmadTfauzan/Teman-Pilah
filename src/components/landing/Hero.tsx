'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HeroSlide } from '@/types';
import { getHeroImageUrl } from '@/lib/api/hero';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroProps {
  initialSlides?: HeroSlide[];
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 'default-1',
    imageUrl: '/pengmas 2.png',
    altText: 'Bersama Membangun Ekosistem Hijau',
    caption: 'Kegiatan Teman Pilah',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'default-2',
    imageUrl: '/images/hero/hero-01-kebun.webp',
    altText: 'Edukasi dan Pemilahan Sampah Berkelanjutan',
    caption: 'Edukasi Warga',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'default-3',
    imageUrl: '/images/hero/hero-02-gerbang.webp',
    altText: 'Komunitas Teman Pilah Bergerak Nyata',
    caption: 'Aksi Nyata Lingkungan',
    sortOrder: 3,
    isActive: true,
  },
];

export function Hero({ initialSlides }: HeroProps) {
  const [slides, setSlides] = useState<HeroSlide[]>(() => {
    if (initialSlides && initialSlides.length > 0) {
      const activeOnly = initialSlides.filter((s) => s.isActive);
      return activeOnly.length > 0 ? activeOnly : initialSlides;
    }
    return DEFAULT_SLIDES;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Fallback client-side fetch if initialSlides were empty
  useEffect(() => {
    if (!initialSlides || initialSlides.length === 0) {
      fetch('/api/hero')
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
            const active = json.data.filter((s: HeroSlide) => s.isActive);
            if (active.length > 0) {
              setSlides(active);
            }
          }
        })
        .catch(() => {});
    }
  }, [initialSlides]);

  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Autoplay ~6 seconds
  useEffect(() => {
    if (isHovered || totalSlides <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 6000);
    return () => clearInterval(interval);
  }, [isHovered, totalSlides, nextSlide]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    setIsHovered(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    setIsHovered(false);
  };

  return (
    <section
      id="beranda"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[820px] max-h-[100vh] min-h-[640px] flex items-center justify-center overflow-hidden bg-[#012D1D] select-none"
    >
      {/* ─── BACKGROUND SLIDES CAROUSEL ─── */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, idx) => {
          const isCurrent = idx === currentIndex;
          const imgUrl = getHeroImageUrl(slide.imageUrl);

          return (
            <div
              key={slide.id || idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <Image
                src={imgUrl}
                alt={slide.altText || 'Teman Pilah Hero'}
                fill
                unoptimized
                priority={idx === 0}
                className="object-cover object-center scale-105 transition-transform duration-10000 ease-out"
                sizes="100vw"
              />
            </div>
          );
        })}
      </div>

      {/* ─── DARK OVERLAY (Figma: rgba(0, 0, 0, 0.65)) ─── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-black/65 pointer-events-none"
      />

      {/* ─── HERO CONTENT CONTAINER (Figma Layout) ─── */}
      <div className="relative z-20 w-full max-w-[841px] px-5 sm:px-6 text-center flex flex-col items-center pt-20 sm:pt-24">
        {/* HEADING (2 Lines) */}
        <h1 className="font-['Poppins'] font-bold tracking-tight">
          <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-[70px] leading-[1.15] text-[#3B9734] drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
            Bersama Membangun
          </span>
          <span className="block text-[42px] sm:text-[54px] md:text-[66px] lg:text-[75px] leading-[1.15] text-[#FC9634] mt-1 drop-shadow-[0_2px_14px_rgba(0,0,0,0.6)]">
            Ekosistem Hijau
          </span>
        </h1>

        {/* SUBTITLE PARAGRAPH (Figma spec: 680px max width, Poppins 500, 18px, 31px line-height, #FFFFFF) */}
        <p className="font-['Poppins'] font-medium text-sm sm:text-base md:text-[18px] leading-relaxed md:leading-[31px] text-white max-w-[680px] mt-6 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
          Ubah kebiasaan buang sampah jadi berkah. Bareng Teman Pilah, kita jaga
          lingkungan jadi lebih asri, sehat, dan bermanfaat lewat aksi sederhana
          setiap hari.
        </p>

        {/* CTA BUTTONS */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/eco-enzyme"
            className="inline-flex items-center justify-center rounded-full bg-[#FC9634] hover:bg-[#e8801a] text-white font-['Poppins'] font-bold text-sm sm:text-base px-7 py-3.5 shadow-lg shadow-[#FC9634]/30 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Eco Enzyme
          </Link>
          <a
            href="#bank-sampah"
            className="inline-flex items-center justify-center rounded-full bg-[#3B9734] hover:bg-[#2F8029] text-white font-['Poppins'] font-bold text-sm sm:text-base px-7 py-3.5 shadow-lg shadow-[#3B9734]/30 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Bank Sampah
          </a>
        </div>

        {/* ─── CAROUSEL INDICATOR PILLS (Figma: 32px x 6px, border-radius 99px) ─── */}
        {totalSlides > 1 && (
          <div
            role="tablist"
            aria-label="Hero Slide Indicator"
            className="flex items-center justify-center gap-2 mt-12 sm:mt-16"
          >
            {slides.map((_, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-[6px] w-[32px] rounded-[99px] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#FC9634] ${
                    isActive ? 'bg-[#FC9634]' : 'bg-white/70 hover:bg-white'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ─── DESKTOP NAVIGATION ARROWS ─── */}
      {totalSlides > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Slide sebelumnya"
            className="hidden md:flex absolute left-6 lg:left-12 top-1/2 -translate-y-1/2 z-20 h-12 w-12 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Slide selanjutnya"
            className="hidden md:flex absolute right-6 lg:right-12 top-1/2 -translate-y-1/2 z-20 h-12 w-12 items-center justify-center rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-95"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
    </section>
  );
}

export default Hero;
