'use client';

import { Search, LogOut, Menu, ChevronRight, X } from 'lucide-react';
import { useState, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { clearStoredAuthSession } from '@/lib/api/auth-session';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

interface AdminModuleLink {
  label: string;
  description: string;
  path: string;
  keywords: string;
}

const ADMIN_MODULES: AdminModuleLink[] = [
  {
    label: 'Dashboard',
    description: 'Overview statistik & aktivitas terbaru',
    path: '/admin',
    keywords: 'dashboard overview beranda statistik aktivitas',
  },
  {
    label: 'Banner Hero',
    description: 'Atur slide foto background halaman utama',
    path: '/admin/hero',
    keywords: 'banner hero slider landing foto background',
  },
  {
    label: 'Kelola Program',
    description: 'Berita, artikel & program warga',
    path: '/admin/news',
    keywords: 'program berita news artikel kegiatan',
  },
  {
    label: 'Kelola Produk',
    description: 'Katalog produk daur ulang, stok & QR',
    path: '/admin/products',
    keywords: 'produk product katalog harga stok qr',
  },
  {
    label: 'Konten Edukasi',
    description: 'Materi & panduan pemilahan sampah',
    path: '/admin/education',
    keywords: 'edukasi education konten artikel materi',
  },
  {
    label: 'Eco Enzyme',
    description: 'Galon fermentasi, log inspeksi & video',
    path: '/admin/eco-enzyme',
    keywords: 'eco enzyme fermentasi galon panen log qr',
  },
  {
    label: 'Kelola Galeri',
    description: 'Dokumentasi foto aksi nyata',
    path: '/admin/gallery',
    keywords: 'galeri gallery foto dokumentasi',
  },
  {
    label: 'Video Bank Sampah',
    description: 'Video YouTube, Instagram & TikTok',
    path: '/admin/videos',
    keywords: 'video bank sampah youtube instagram tiktok',
  },
];

function subscribeToStorage(callback: () => void) {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
}

function getAdminEmailSnapshot(): string {
  if (typeof window === 'undefined') return '';
  try {
    return (
      localStorage.getItem('adminEmail') ||
      sessionStorage.getItem('adminEmail') ||
      ''
    );
  } catch {
    return '';
  }
}

function getServerAdminEmailSnapshot(): string {
  return '';
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const storedEmail = useSyncExternalStore(
    subscribeToStorage,
    getAdminEmailSnapshot,
    getServerAdminEmailSnapshot
  );

  const adminName = storedEmail || 'Admin User';
  const initials = storedEmail ? storedEmail.substring(0, 2).toUpperCase() : 'AU';

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const filteredModules = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ADMIN_MODULES;
    return ADMIN_MODULES.filter(
      (mod) =>
        mod.label.toLowerCase().includes(q) ||
        mod.description.toLowerCase().includes(q) ||
        mod.path.toLowerCase().includes(q) ||
        mod.keywords.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const safeActiveIndex =
    filteredModules.length > 0
      ? Math.min(activeIndex, filteredModules.length - 1)
      : 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectModule = (path: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setActiveIndex(0);
    router.push(path);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsSearchOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsSearchOpen(true);
      if (filteredModules.length > 0) {
        setActiveIndex((prev) => (prev + 1) % filteredModules.length);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsSearchOpen(true);
      if (filteredModules.length > 0) {
        setActiveIndex((prev) =>
          prev - 1 < 0 ? filteredModules.length - 1 : prev - 1
        );
      }
      return;
    }

    if (e.key === 'Enter' && isSearchOpen && filteredModules.length > 0) {
      e.preventDefault();
      handleSelectModule(filteredModules[safeActiveIndex].path);
    }
  };

  const handleLogout = () => {
    clearStoredAuthSession();
    toast.success('Berhasil logout');
    router.push('/login');
  };

  return (
    <header className="fixed left-0 lg:left-[280px] right-0 top-0 z-40 h-14 sm:h-16 border-b border-[#c2c9bb] bg-[#f9faf5] px-3 sm:px-6 lg:px-8 py-0 shadow-sm flex items-center justify-between gap-3">
      {/* Burger Menu for Mobile */}
      {onToggleSidebar && (
        <button
          type="button"
          onClick={onToggleSidebar}
          className="mr-1 sm:mr-2 p-1.5 sm:p-2 rounded-lg text-[#2D5A27] hover:bg-[#F3F4EF] lg:hidden flex-shrink-0"
          aria-label="Toggle sidebar"
        >
          <Menu size={22} />
        </button>
      )}

      {/* Quick-Jump Search Bar */}
      <div
        ref={searchContainerRef}
        className="flex-1 max-w-xs md:max-w-md hidden sm:block relative"
      >
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearchOpen(true)}
            onClick={() => setIsSearchOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setActiveIndex(0);
              setIsSearchOpen(true);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Cari modul admin..."
            aria-label="Cari modul admin"
            aria-expanded={isSearchOpen}
            aria-haspopup="listbox"
            role="combobox"
            aria-controls="admin-module-quick-jump"
            className="w-full bg-white/70 border border-gray-300 rounded-full py-2 pl-11 pr-9 focus:outline-none focus:border-[#2D5A27] focus:bg-white text-sm text-gray-700 placeholder-gray-400 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveIndex(0);
                setIsSearchOpen(true);
              }}
              aria-label="Bersihkan pencarian"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:text-gray-700"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {isSearchOpen && (
          <div
            id="admin-module-quick-jump"
            role="listbox"
            className="absolute left-0 right-0 mt-2 rounded-2xl border border-[#DCE3D5] bg-white shadow-xl overflow-hidden z-50"
          >
            <div className="px-3.5 py-2 border-b border-[#F0F2EB] bg-[#F9FAF8] flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#72796E]">
                Quick Jump Modul Admin
              </span>
              <span className="text-[10px] text-[#9AA395]">
                {filteredModules.length} modul
              </span>
            </div>

            {filteredModules.length > 0 ? (
              <ul className="max-h-72 overflow-y-auto divide-y divide-[#F5F7F2]">
                {filteredModules.map((mod, idx) => {
                  const isCurrent = pathname === mod.path;
                  const isHighlighted = idx === safeActiveIndex;
                  return (
                    <li key={mod.path}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={isHighlighted}
                        onClick={() => handleSelectModule(mod.path)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                          isHighlighted
                            ? 'bg-[#EEF5EC] text-[#1B361F]'
                            : 'hover:bg-[#F9FAF8] text-[#2A3426]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold truncate">
                              {mod.label}
                            </span>
                            {isCurrent && (
                              <span className="rounded-full bg-[#2D5A27] px-1.5 py-0.5 text-[9px] font-bold text-white">
                                Aktif
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#72796E] truncate">
                            {mod.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 text-[10px] font-mono text-[#8A9483]">
                          <span>{mod.path}</span>
                          <ChevronRight size={14} />
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-4 py-6 text-center text-xs text-[#72796E]">
                Modul admin tidak ditemukan.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <nav aria-label="Header actions" className="inline-flex items-center gap-2 sm:gap-6 ml-auto">
        <div className="inline-flex items-center gap-2 sm:gap-4">
          <div className="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-full border-[1.5px] border-[#9DD090] bg-transparent text-green-700 font-bold text-xs sm:text-sm">
            {initials}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">{adminName}</span>

          <button
            type="button"
            onClick={handleLogout}
            className="ml-1 sm:ml-2 p-1.5 sm:p-2 text-[#42493E] hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </nav>
    </header>
  );
}
