'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FlaskConical, BookOpen, ShoppingBag, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Beranda', href: '/', icon: Home },
  { label: 'Eco Enzyme', href: '/eco-enzyme', icon: FlaskConical },
  { label: 'Edukasi', href: '/#edukasi', icon: BookOpen },
  { label: 'Produk', href: '/#katalog', icon: ShoppingBag },
  { label: 'Lainnya', href: '/#kontak', icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama mobile"
      className="fixed bottom-0 left-0 right-0 z-40 flex h-14 items-stretch border-t border-black/5 bg-[#FAFAF8] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {navItems.map((item) => {
        const hrefBase = item.href.split('#')[0];
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : hrefBase !== '/' && pathname.startsWith(hrefBase);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors',
              isActive ? 'text-[#154212]' : 'text-[#8F9A8A]'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            <span
              className={cn(
                'text-[10px] leading-none',
                isActive ? 'font-semibold' : 'font-normal'
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
