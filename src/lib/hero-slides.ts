export interface HeroSlideItem {
  id: string | number;
  imageUrl: string;
  src?: string; // alias for compatibility
  altText: string;
  alt?: string; // alias for compatibility
  caption?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
  sortOrder: number;
  isActive: boolean;
  focal: {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
  };
}

export const HERO_SLIDES: HeroSlideItem[] = [
  {
    id: 1,
    imageUrl: '/images/hero/hero-01-kebun.webp',
    src: '/images/hero/hero-01-kebun.webp',
    altText: 'Tim dan relawan Teman Pilah berfoto di kebun urban dengan pot dari botol bekas',
    alt: 'Tim dan relawan Teman Pilah berfoto di kebun urban dengan pot dari botol bekas',
    caption: null, // TODO: Konfirmasi jika ingin menambahkan caption acara/kegiatan
    sortOrder: 1,
    isActive: true,
    focal: { x: 55, y: 25 },
  },
  {
    id: 2,
    imageUrl: '/images/hero/hero-02-gerbang.webp',
    src: '/images/hero/hero-02-gerbang.webp',
    altText: 'Ibu-ibu komunitas Teman Pilah berfoto di depan gerbang yang rimbun tanaman',
    alt: 'Ibu-ibu komunitas Teman Pilah berfoto di depan gerbang yang rimbun tanaman',
    caption: null, // TODO: Konfirmasi jika ingin menambahkan caption acara/kegiatan
    sortOrder: 2,
    isActive: true,
    focal: { x: 50, y: 45 },
  },
  {
    id: 3,
    imageUrl: '/images/hero/hero-03-kebun-2.webp',
    src: '/images/hero/hero-03-kebun-2.webp',
    altText: 'Tim dan relawan Teman Pilah berfoto bersama di kebun urban',
    alt: 'Tim dan relawan Teman Pilah berfoto bersama di kebun urban',
    caption: null, // TODO: Konfirmasi jika ingin menambahkan caption acara/kegiatan
    sortOrder: 3,
    isActive: true,
    focal: { x: 55, y: 25 },
  },
];
