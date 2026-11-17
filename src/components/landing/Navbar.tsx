'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Container } from '@/components/layout/Container';

export function Navbar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const isHome = pathname === '/';

  useEffect(() => {
    if (!isHome) {
      setIsScrolled(true);
      return;
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  const navLinks = [
    { name: 'Beranda', href: '/' },
    { name: 'Tentang Kami', href: '/#tentang' },
    { name: 'Program', href: '/#program' },
    { name: 'Edukasi', href: '/#edukasi' },
    { name: 'Katalog', href: '/#katalog' },
    { name: 'Kontak', href: '/#kontak' },
  ];

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-[76px] w-full transition-all duration-300',
        isScrolled
          ? 'bg-[#012D1D]/95 backdrop-blur-md shadow-lg border-b border-[#0B4A31]'
          : 'bg-[#012D1D]/75 backdrop-blur-sm border-b border-white/10'
      )}
    >
      <Container className="h-full flex items-center justify-between">
        {/* LOGO & BRAND */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-full overflow-hidden flex items-center justify-center bg-white/10 transition-transform group-hover:scale-105">
            <img
              src="/IMG_8588.JPG-removebg-preview.png"
              alt="Teman Pilah"
              className="h-full w-full object-cover"
              onError={(e) => {
                // fallback to /logo.png if needed
                (e.target as HTMLImageElement).src = '/logo.png';
              }}
            />
          </div>
          <span className="font-['Poppins'] font-bold text-lg sm:text-[20px] text-white tracking-tight">
            Teman Pilah
          </span>
        </Link>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-7 lg:gap-9">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="font-['Poppins'] font-semibold text-[15px] lg:text-[16px] text-white/90 hover:text-white transition-colors relative py-1 group"
            >
              {link.name}
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#FC9634] transition-all duration-200 group-hover:w-full" />
            </Link>
          ))}
        </div>

        {/* RIGHT ACTION BUTTON */}
        <div className="hidden lg:flex items-center gap-3">
          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#FC9634] hover:bg-[#e8801a] text-white font-['Poppins'] font-semibold text-sm px-5 py-2.5 transition-all duration-200 shadow-md hover:scale-105 active:scale-95"
          >
            <img src="/wa.png" alt="WhatsApp" className="h-4 w-4 object-contain brightness-0 invert" />
            <span>Hubungi Kami</span>
          </a>
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
          aria-label={isMobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </Container>

      {/* MOBILE MENU DRAWER */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed top-[76px] left-0 right-0 bg-[#012D1D] border-b border-[#0B4A31] shadow-2xl px-6 py-5 flex flex-col gap-4"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-['Poppins'] font-semibold text-base text-white/90 hover:text-[#FC9634] py-1 border-b border-white/5"
              >
                {link.name}
              </Link>
            ))}

            <div className="pt-2">
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#FC9634] text-white font-semibold py-3 text-sm shadow-md"
              >
                <img src="/wa.png" alt="WhatsApp" className="h-4 w-4 object-contain brightness-0 invert" />
                <span>Hubungi via WhatsApp</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Navbar;
