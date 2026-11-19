'use client';

import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Mail, Phone } from 'lucide-react';
import { ConcentricCircles } from '@/components/ui/DecorativeElements';

export function Footer() {
  const navLinks = [
    { name: 'Beranda', href: '/' },
    { name: 'Tentang Kami', href: '/#tentang' },
    { name: 'Program', href: '/#program' },
    { name: 'Edukasi', href: '/#edukasi' },
  ];

  const otherLinks = [
    { name: 'Katalog', href: '/#katalog' },
    { name: 'Dokumentasi', href: '/#galeri' },
    { name: 'Kontak', href: '/#kontak' },
  ];

  return (
    <footer
      id="kontak"
      className="relative w-full bg-[#012D1D] pt-8 pb-6 sm:pt-20 sm:pb-8 text-[#C9D6CF] overflow-hidden scroll-mt-16 md:scroll-mt-20"
    >
      {/* ─── DECORATIVE ACCENTS (Figma Frame 48) ─── */}
      <div className="hidden sm:block absolute -right-24 -bottom-24 opacity-20 pointer-events-none">
        <ConcentricCircles size={360} color="#0B4A31" />
      </div>
      <Container>
        {/* ─── TOP SECTION: 3 COLUMNS ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-10 lg:gap-12 pb-6 sm:pb-14">
          {/* COLUMN 1: BRAND & CONTACT (Figma: 461px -> lg:col-span-6) */}
          <div className="col-span-2 lg:col-span-6 flex flex-col gap-3.5 sm:gap-6">
            {/* Logo & Name */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-[#FC9634] text-[#012D1D] shadow-md overflow-hidden">
                <img
                  src="/IMG_8588.JPG-removebg-preview.png"
                  alt="Teman Pilah"
                  className="h-6 w-6 sm:h-8 sm:w-8 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.png';
                  }}
                />
              </div>
              <span className="font-['Poppins'] font-bold text-lg sm:text-2xl text-white tracking-tight">
                Teman Pilah
              </span>
            </div>

            {/* Description */}
            <p className="font-['Poppins'] font-normal text-xs sm:text-base text-[#C9D6CF] leading-relaxed max-w-[440px]">
              Mewujudkan lingkungan yang asri melalui aksi nyata, edukasi
              berkelanjutan, dan kolaborasi masyarakat dalam pengelolaan sampah
              yang bijak.
            </p>

            {/* Contact & Social Media details */}
            <div className="flex flex-col gap-2 sm:gap-3 font-['Poppins'] text-xs sm:text-base text-white pt-0.5 sm:pt-2">
              <a
                href="mailto:halo@temanpilah.com"
                className="flex items-center gap-2.5 sm:gap-3 hover:text-[#FC9634] transition-colors"
              >
                <Mail className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-[#FC9634] shrink-0" />
                <span>halo@temanpilah.com</span>
              </a>

              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 sm:gap-3 hover:text-[#FC9634] transition-colors"
              >
                <Phone className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-[#FC9634] shrink-0" />
                <span>+62 812-3456-7890</span>
              </a>

              <a
                href="https://www.instagram.com/temanpilah"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 sm:gap-3 hover:text-[#FC9634] transition-colors"
              >
                <svg
                  className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-[#FC9634] fill-current shrink-0"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span>Instagram (@temanpilah)</span>
              </a>

              <a
                href="https://www.tiktok.com/@teman_pilah"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 sm:gap-3 hover:text-[#FC9634] transition-colors"
              >
                <svg
                  className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-[#FC9634] fill-current shrink-0"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
                <span>TikTok (@teman_pilah)</span>
              </a>
            </div>
          </div>

          {/* COLUMN 2: NAVIGASI (Figma: 329px -> lg:col-span-3) */}
          <div className="col-span-1 lg:col-span-3 flex flex-col gap-2.5 sm:gap-4">
            <h4 className="font-['Poppins'] font-bold text-sm sm:text-lg text-white">
              Navigasi
            </h4>
            <ul className="flex flex-col gap-2 sm:gap-3 font-['Poppins'] text-xs sm:text-base">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMN 3: LAINNYA (Figma: 329px -> lg:col-span-3) */}
          <div className="col-span-1 lg:col-span-3 flex flex-col gap-2.5 sm:gap-4">
            <h4 className="font-['Poppins'] font-bold text-sm sm:text-lg text-white">
              Lainnya
            </h4>
            <ul className="flex flex-col gap-2 sm:gap-3 font-['Poppins'] text-xs sm:text-base">
              {otherLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="hover:text-white transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/admin"
                  className="text-[11px] sm:text-xs text-white/40 hover:text-white/80 transition-colors pt-1 sm:pt-2 block"
                >
                  Panel Admin →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ─── BOTTOM BAR: COPYRIGHT & CREDITS ─── */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-2.5 sm:gap-4 pt-4 sm:pt-6 border-t border-[#0B4A31] font-['Poppins'] text-[11px] sm:text-sm text-[#C9D6CF]">
          <p className="text-center lg:text-left">
            © {new Date().getFullYear()} Teman Pilah. Melestarikan lingkungan bersama melalui aksi nyata.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-center sm:text-right">
            <a
              href="https://www.linkedin.com/in/zhafran-suryananda-6430043b0/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#FC9634] transition-colors"
            >
              Designed by{' '}
              <span className="font-semibold text-white hover:text-[#FC9634] underline-offset-4 hover:underline">
                Muhammad Zhafran Suryananda
              </span>
            </a>
            <a
              href="https://www.linkedin.com/in/ahmad-tabib-fauzan-94b1b0333"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#FC9634] transition-colors"
            >
              Developed by{' '}
              <span className="font-semibold text-white hover:text-[#FC9634] underline-offset-4 hover:underline">
                Ahmad Tabib Fauzan
              </span>
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
