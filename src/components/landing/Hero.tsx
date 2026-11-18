'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HeroSlide } from '@/types';
import { getHeroImageUrl } from '@/lib/api/hero';

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
      return activeOnly.length > 0 ? activeOnly : DEFAULT_SLIDES;
    }
    return DEFAULT_SLIDES;
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Sync latest active slides from API on client mount so admin changes appear immediately
  useEffect(() => {
    let cancelled = false;
    fetch('/api/hero', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (cancelled) return;
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          const active = json.data.filter((s: HeroSlide) => s.isActive);
          if (active.length > 0) {
            setSlides(active);
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const totalSlides = slides.length;
  const activeSlideIndex = totalSlides > 0 ? currentIndex % totalSlides : 0;

  const nextSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Continuous autoplay every 5 seconds (does not freeze when cursor is inside viewport)
  useEffect(() => {
    if (totalSlides <= 1) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [totalSlides, activeSlideIndex, nextSlide]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
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
  };

  return (
    <section
      id="beranda"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[490px] sm:h-[640px] lg:h-[820px] max-h-[100vh] min-h-[450px] flex items-center justify-center overflow-hidden bg-[#012D1D] select-none"
    >
      {/* ─── BACKGROUND SLIDES CAROUSEL ─── */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, idx) => {
          const isCurrent = idx === activeSlideIndex;
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
      <div className="relative z-20 w-full max-w-[841px] px-4 sm:px-6 text-center flex flex-col items-center pt-12 sm:pt-24">
        {/* HEADING (2 Lines) */}
        <h1 className="font-['Poppins'] font-bold tracking-tight">
          <span className="block text-3xl sm:text-5xl md:text-6xl lg:text-[70px] leading-[1.15] text-[#3B9734] drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
            Bersama Membangun
          </span>
          <span className="block text-[34px] sm:text-[54px] md:text-[66px] lg:text-[75px] leading-[1.15] text-[#FC9634] mt-1 drop-shadow-[0_2px_14px_rgba(0,0,0,0.6)]">
            Ekosistem Hijau
          </span>
        </h1>

        {/* SUBTITLE PARAGRAPH (Figma spec: 680px max width, Poppins 500, 18px, 31px line-height, #FFFFFF) */}
        <p className="font-['Poppins'] font-medium text-xs sm:text-base md:text-[18px] leading-relaxed md:leading-[31px] text-white max-w-[680px] mt-3 sm:mt-6 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
          Ubah kebiasaan buang sampah jadi berkah. Bareng Teman Pilah, kita jaga
          lingkungan jadi lebih asri, sehat, dan bermanfaat lewat aksi sederhana
          setiap hari.
        </p>

        {/* CTA BUTTONS */}
        <div className="mt-5 sm:mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4">
          <Link
            href="/eco-enzyme"
            className="inline-flex items-center justify-center rounded-full bg-[#FC9634] hover:bg-[#e8801a] text-white font-['Poppins'] font-bold text-xs sm:text-base px-5 py-2.5 sm:px-7 sm:py-3.5 shadow-lg shadow-[#FC9634]/30 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Eco Enzyme
          </Link>
          <a
            href="#bank-sampah"
            className="inline-flex items-center justify-center rounded-full bg-[#3B9734] hover:bg-[#2F8029] text-white font-['Poppins'] font-bold text-xs sm:text-base px-5 py-2.5 sm:px-7 sm:py-3.5 shadow-lg shadow-[#3B9734]/30 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Bank Sampah
          </a>
        </div>

        {/* ─── CAROUSEL INDICATOR PILLS (Figma: 32px x 6px, border-radius 99px) ─── */}
        {totalSlides > 1 && (
          <div
            role="tablist"
            aria-label="Hero Slide Indicator"
            className="flex items-center justify-center gap-2 mt-6 sm:mt-16"
          >
            {slides.map((_, idx) => {
              const isActive = idx === activeSlideIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
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
    </section>
  );
}

export default Hero;
