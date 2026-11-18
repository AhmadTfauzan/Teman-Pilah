'use client';

import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Globe, Mail, Phone } from 'lucide-react';
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

            {/* Contact details */}
            <div className="flex flex-col gap-2 sm:gap-3 font-['Poppins'] text-xs sm:text-base text-white pt-0.5 sm:pt-2">
              <a
                href="https://temanpilah.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 sm:gap-3 hover:text-[#FC9634] transition-colors"
              >
                <Globe className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-[#FC9634] shrink-0" />
                <span>temanpilah.com</span>
              </a>

              <a
                href="mailto:halo@temanpilah.com"
                className="flex items-center gap-2.5 sm:gap-3 hover:text-[#FC9634] transition-colors"
              >
                <Mail className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-[#FC9634] shrink-0" />
                <span>halo@temanpilah.com</span>
              </a>

              {/* Synced with Navbar wa.me/6281234567890 placeholder */}
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 sm:gap-3 hover:text-[#FC9634] transition-colors"
              >
                <Phone className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-[#FC9634] shrink-0" />
                <span>+62 812-3456-7890</span>
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

        {/* ─── BOTTOM BAR: COPYRIGHT & POLICIES ─── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 pt-4 sm:pt-6 border-t border-[#0B4A31] font-['Poppins'] text-[11px] sm:text-sm text-[#C9D6CF]">
          <p className="text-center sm:text-left">
            © {new Date().getFullYear()} Teman Pilah. Melestarikan lingkungan bersama melalui aksi nyata.
          </p>

          <div className="flex items-center gap-5 sm:gap-8">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Kebijakan Privasi
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Syarat & Ketentuan
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
