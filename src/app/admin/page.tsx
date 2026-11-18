'use client';

import { getBaseUrl } from '../../lib/api-config';
import React from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  Package,
  GraduationCap,
  Image as ImageIcon,
  MoreVertical,
} from 'lucide-react';
import { Education, Gallery, News, Product } from '@/types';
import { AdminActivity } from '@/lib/utils';

const BASE_URL = getBaseUrl();

interface PaginatedApiResponse<T> {
  data?: T[];
  meta?: {
    total?: number;
  };
}

type ProductWithTimestamps = Product & {
  createdAt?: string;
  updatedAt?: string;
};

interface DashboardActivity {
  id: string;
  title: string;
  date: string;
  status: string;
  iconBg: string;
  rawDate: number;
  href: string;
}

function formatActivityTimestamp(timestamp?: string): {
  date: string;
  rawDate: number;
} {
  if (!timestamp) {
    return { date: 'Hari Ini', rawDate: 0 };
  }
  const parsed = new Date(timestamp);
  const time = parsed.getTime();
  if (Number.isNaN(time)) {
    return { date: 'Hari Ini', rawDate: 0 };
  }
  return {
    date: parsed.toLocaleDateString('id-ID', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    rawDate: time,
  };
}

function resolveActivityHref(id: string, title: string): string {
  const lowerId = id.toLowerCase();
  const lowerTitle = title.toLowerCase();
  if (
    lowerId.startsWith('news-') ||
    lowerId.includes('program') ||
    lowerTitle.includes('program')
  ) {
    return '/admin/news';
  }
  if (
    lowerId.startsWith('prod-') ||
    lowerTitle.includes('produk') ||
    lowerTitle.includes('product')
  ) {
    return '/admin/products';
  }
  if (
    lowerId.startsWith('gal-') ||
    lowerTitle.includes('galeri') ||
    lowerTitle.includes('gallery')
  ) {
    return '/admin/gallery';
  }
  if (
    lowerId.startsWith('edu-') ||
    lowerTitle.includes('edukasi') ||
    lowerTitle.includes('education')
  ) {
    return '/admin/education';
  }
  if (lowerTitle.includes('hero')) {
    return '/admin/hero';
  }
  if (lowerTitle.includes('eco enzyme') || lowerTitle.includes('galon')) {
    return '/admin/eco-enzyme';
  }
  if (lowerTitle.includes('video')) {
    return '/admin/videos';
  }
  return '/admin';
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = React.useState({
    programs: 0,
    products: 0,
    education: 0,
    gallery: 0,
  });
  const [activities, setActivities] = React.useState<DashboardActivity[]>([]);

  React.useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      try {
        const [newsRes, productsRes, educationRes, galleryRes] = await Promise.all([
          fetch(`${BASE_URL}/api/news?limit=100`, { cache: 'no-store' }).catch(() => null),
          fetch(`${BASE_URL}/api/products?limit=100`, { cache: 'no-store' }).catch(() => null),
          fetch(`${BASE_URL}/api/education?limit=100`, { cache: 'no-store' }).catch(() => null),
          fetch(`${BASE_URL}/api/gallery?limit=100`, { cache: 'no-store' }).catch(() => null),
        ]);

        let programsCount = 0;
        let productsCount = 0;
        let educationCount = 0;
        let galleryCount = 0;
        let newActivities: DashboardActivity[] = [];

        if (newsRes && newsRes.ok) {
          const newsData = (await newsRes.json().catch(() => null)) as PaginatedApiResponse<News> | null;
          const items = Array.isArray(newsData?.data) ? newsData.data : [];
          programsCount = newsData?.meta?.total ?? items.length;

          const mappedNews: DashboardActivity[] = items.map((n) => {
            const { date, rawDate } = formatActivityTimestamp(n.updatedAt || n.createdAt);
            return {
              id: `news-${n.id}`,
              title: `Program baru diterbitkan: ${n.title}`,
              date,
              status: 'SUKSES',
              iconBg: 'bg-[#FDF2F2]',
              rawDate,
              href: '/admin/news',
            };
          });
          newActivities = [...newActivities, ...mappedNews];
        }

        if (productsRes && productsRes.ok) {
          const productsData = (await productsRes.json().catch(() => null)) as PaginatedApiResponse<ProductWithTimestamps> | null;
          const items = Array.isArray(productsData?.data) ? productsData.data : [];
          productsCount = productsData?.meta?.total ?? items.length;

          const mappedProducts: DashboardActivity[] = items.map((p) => {
            const { date, rawDate } = formatActivityTimestamp(p.updatedAt || p.createdAt);
            return {
              id: `prod-${p.id}`,
              title: `Produk diperbarui: ${p.name}`,
              date,
              status: 'SUKSES',
              iconBg: 'bg-[#FEF3C7]',
              rawDate,
              href: '/admin/products',
            };
          });
          newActivities = [...newActivities, ...mappedProducts];
        }

        if (educationRes && educationRes.ok) {
          const educationData = (await educationRes.json().catch(() => null)) as PaginatedApiResponse<Education> | null;
          const items = Array.isArray(educationData?.data) ? educationData.data : [];
          educationCount = educationData?.meta?.total ?? items.length;

          const mappedEducation: DashboardActivity[] = items.map((e) => {
            const { date, rawDate } = formatActivityTimestamp(e.updatedAt || e.createdAt);
            return {
              id: `edu-${e.id}`,
              title: `Konten edukasi diterbitkan: ${e.title}`,
              date,
              status: 'SUKSES',
              iconBg: 'bg-[#DCFCE7]',
              rawDate,
              href: '/admin/education',
            };
          });
          newActivities = [...newActivities, ...mappedEducation];
        }

        if (galleryRes && galleryRes.ok) {
          const galleryData = (await galleryRes.json().catch(() => null)) as PaginatedApiResponse<Gallery> | null;
          const items = Array.isArray(galleryData?.data) ? galleryData.data : [];
          galleryCount = galleryData?.meta?.total ?? items.length;

          const mappedGallery: DashboardActivity[] = items.map((g) => {
            const { date, rawDate } = formatActivityTimestamp(g.updatedAt || g.createdAt);
            return {
              id: `gal-${g.id}`,
              title: `Item galeri diunggah`,
              date,
              status: 'SUKSES',
              iconBg: 'bg-[#F3E8FF]',
              rawDate,
              href: '/admin/gallery',
            };
          });
          newActivities = [...newActivities, ...mappedGallery];
        }

        // Load CRUD activities recorded in localStorage without breaking metrics if corrupted
        let localActivities: DashboardActivity[] = [];
        try {
          const stored = localStorage.getItem('admin_activities');
          if (stored) {
            const parsed: unknown = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              localActivities = parsed
                .filter((item): item is AdminActivity => Boolean(item && typeof item === 'object' && 'id' in item && 'title' in item))
                .map((item) => {
                  const id = String(item.id);
                  const title = String(item.title);
                  return {
                    id,
                    title,
                    date: String(item.date || 'Hari Ini'),
                    status: String(item.status || 'SUKSES'),
                    iconBg: String(item.iconBg || 'bg-[#F4F5F2]'),
                    rawDate: Number(item.rawDate) || 0,
                    href: resolveActivityHref(id, title),
                  };
                });
            }
          }
        } catch (storageError) {
          console.warn('Corrupted admin_activities in localStorage, ignoring:', storageError);
        }

        if (cancelled) return;

        newActivities = [...newActivities, ...localActivities];
        newActivities.sort((a, b) => (Number(b.rawDate) || 0) - (Number(a.rawDate) || 0));
        setActivities(newActivities.slice(0, 10));

        setStats({
          programs: programsCount,
          products: productsCount,
          education: educationCount,
          gallery: galleryCount,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentCards = [
    {
      id: 'total-programs',
      title: 'TOTAL PROGRAM',
      value: stats.programs.toString(),
      icon: ClipboardList,
      iconBg: 'bg-[#FDF2F2]',
      iconColor: 'text-[#E02424]',
    },
    {
      id: 'total-products',
      title: 'TOTAL PRODUK',
      value: stats.products.toString(),
      icon: Package,
      iconBg: 'bg-[#FEF3C7]',
      iconColor: 'text-[#D97706]',
    },
    {
      id: 'total-education',
      title: 'TOTAL EDUKASI',
      value: stats.education.toString(),
      icon: GraduationCap,
      iconBg: 'bg-[#DCFCE7]',
      iconColor: 'text-[#059669]',
    },
    {
      id: 'total-gallery',
      title: 'TOTAL GALERI',
      value: stats.gallery.toString(),
      icon: ImageIcon,
      iconBg: 'bg-[#F3E8FF]',
      iconColor: 'text-[#7C3AED]',
    },
  ];

  return (
    <div className="flex flex-col gap-4 sm:gap-10">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-3xl lg:text-[32px] font-extrabold text-[#1B361F] tracking-tight">
          Overview Dashboard
        </h1>
        <p className="text-xs sm:text-base text-[#42493E] font-medium">
          Selamat datang kembali! Berikut adalah perkembangan Teman Pilah hari ini.
        </p>
      </div>

      {/* METRIC CARDS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-6 lg:gap-8">
        {currentCards.map((card) => (
          <div key={card.id} className="bg-white rounded-2xl sm:rounded-[24px] p-3.5 sm:p-8 border border-[#C2C9BB]/30 shadow-sm flex flex-col items-start gap-2 sm:gap-6 transition-all hover:shadow-md">
            <div className={`w-9 h-9 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${card.iconBg} ${card.iconColor} flex items-center justify-center flex-shrink-0`}>
              <card.icon className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="space-y-0.5 sm:space-y-1 min-w-0 w-full">
              <p className="text-[10px] sm:text-[11px] font-bold text-[#72796E] tracking-wider sm:tracking-widest uppercase truncate">{card.title}</p>
              <h2 className="text-2xl sm:text-3xl lg:text-[44px] font-extrabold text-[#1B361F] leading-tight">{card.value}</h2>
            </div>
          </div>
        ))}
      </section>

      {/* RECENT ACTIVITY TABLE */}
      <section className="bg-white rounded-2xl sm:rounded-[24px] border border-[#C2C9BB]/30 shadow-sm overflow-hidden mb-6 sm:mb-10">
        <div className="px-3 sm:px-8 py-3 sm:py-6 border-b border-[#C2C9BB]/20 flex items-center justify-between">
          <h2 className="text-base sm:text-xl font-bold text-[#1B361F]">Aktivitas Terbaru</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F4F5F2] border-b border-[#C2C9BB]/20">
                <th className="px-3 sm:px-8 py-2.5 sm:py-3 text-[10px] font-bold text-[#72796E] uppercase tracking-widest min-w-[180px] sm:min-w-[240px]">Aktivitas</th>
                <th className="px-3 sm:px-8 py-2.5 sm:py-3 text-[10px] font-bold text-[#72796E] uppercase tracking-widest min-w-[90px] sm:min-w-[120px]">Tanggal</th>
                <th className="px-3 sm:px-8 py-2.5 sm:py-3 text-[10px] font-bold text-[#72796E] uppercase tracking-widest min-w-[80px] sm:min-w-[100px]">Status</th>
                <th className="px-3 sm:px-8 py-2.5 sm:py-3 text-[10px] font-bold text-[#72796E] uppercase tracking-widest w-8 sm:w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C2C9BB]/10">
              {activities.length > 0 ? (
                activities.map((row) => {
                  const isProgram = row.href === '/admin/news';
                  const isProduct = row.href === '/admin/products';
                  const isGallery = row.href === '/admin/gallery';
                  const Icon = isProgram ? ClipboardList : isProduct ? Package : isGallery ? ImageIcon : GraduationCap;
                  const iconColor = isProgram ? 'text-[#E02424]' : isProduct ? 'text-[#D97706]' : isGallery ? 'text-[#7C3AED]' : 'text-[#059669]';
                  return (
                    <tr key={row.id} className="hover:bg-[#F9FAF5]/50 transition-colors">
                      <td className="px-3 sm:px-8 py-2.5 sm:py-5">
                        <div className="flex items-center gap-2.5 sm:gap-4">
                          <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${row.iconBg} ${iconColor} flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                          </div>
                          <span className="font-bold text-[#1B361F] text-xs sm:text-sm line-clamp-2">{row.title}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-8 py-2.5 sm:py-5 text-[#42493E] font-medium text-[11px] sm:text-xs whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="px-3 sm:px-8 py-2.5 sm:py-5">
                        <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black tracking-wider sm:tracking-widest ${
                          row.status === 'SUKSES' || row.status === 'SUCCESS' ? 'bg-[#E3F2E7] text-[#2F6F1E]' : 'bg-[#FEF3C7] text-[#92400E]'
                        }`}>
                          {row.status === 'SUCCESS' ? 'SUKSES' : row.status}
                        </span>
                      </td>
                      <td className="px-3 sm:px-8 py-2.5 sm:py-5 text-right">
                        <button
                          type="button"
                          onClick={() => router.push(row.href)}
                          title={`Buka modul (${row.href})`}
                          aria-label={`Buka halaman modul untuk ${row.title}`}
                          className="p-1.5 rounded-lg text-[#9BA393] hover:bg-[#F4F5F2] hover:text-[#2A3426] transition-colors"
                        >
                          <MoreVertical size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 sm:px-8 py-8 text-center text-[#72796E] text-xs sm:text-sm">
                    Belum ada aktivitas terbaru.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
