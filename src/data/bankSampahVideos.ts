export type VideoPlatform = 'YouTube' | 'TikTok' | 'Instagram';

export interface BankSampahVideo {
  id: number;
  platform: VideoPlatform;
  duration: string;
  title: string;
  description?: string;
  date: string;
  thumbnail: string;
  videoUrl: string;
  aspect: 'wide' | 'tall'; // wide = 16:9 landscape, tall = 9:16 portrait
  views?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const BANK_SAMPAH_VIDEOS: BankSampahVideo[] = [
  {
    id: 1,
    platform: 'YouTube',
    duration: '8:42',
    title: 'Kunjungan Mahasiswa Telkom University ke Bank Sampah Teman Pilah',
    description:
      'Dokumentasi kunjungan dan observasi langsung sistem penimbangan serta tabungan digital Bank Sampah Teman Pilah oleh tim mahasiswa Telkom University Jakarta.',
    date: '12 Okt 2026',
    thumbnail: '/activity/Pengmas (1).jpeg',
    videoUrl: 'https://www.youtube.com',
    aspect: 'wide',
    views: '1.2k tayangan',
    category: 'Edukasi & Kunjungan',
  },
  {
    id: 2,
    platform: 'TikTok',
    duration: '0:58',
    title: 'Cara Memilah Sampah Rumah Tangga dalam 60 Detik',
    description:
      'Tips cepat dan praktis memisahkan sampah anorganik siap setor ke Bank Sampah agar bernilai ekonomis dan mudah didaur ulang.',
    date: '9 Okt 2026',
    thumbnail: '/activity/Pengmas (2).jpeg',
    videoUrl: 'https://www.tiktok.com',
    aspect: 'tall',
    views: '4.8k tayangan',
    category: 'Tips & Trik',
  },
  {
    id: 3,
    platform: 'Instagram',
    duration: '1:24',
    title: 'Panen Eco Enzyme bersama Ibu-ibu RW 05',
    description:
      'Serunya kegiatan panen eco enzyme fermentasi 90 hari bersama warga Bank Sampah Teman Pilah untuk pembersih alami ramah lingkungan.',
    date: '5 Okt 2026',
    thumbnail: '/activity/Pengmas (4).jpeg',
    videoUrl: 'https://www.instagram.com/temanpilah',
    aspect: 'tall',
    views: '2.3k tayangan',
    category: 'Aksi Warga',
  },
  {
    id: 4,
    platform: 'YouTube',
    duration: '3:10',
    title: 'Penimbangan Rutin Bank Sampah Mandiri & Tukar Tabungan',
    description:
      'Aksi penimbangan berkala setiap minggu di posko Bank Sampah. Sampah anorganik terpilah ditimbang dan langsung dicatat ke buku tabungan warga.',
    date: '1 Okt 2026',
    thumbnail: '/activity/Pengmas (3).jpeg',
    videoUrl: 'https://www.youtube.com',
    aspect: 'wide',
    views: '940 tayangan',
    category: 'Penimbangan',
  },
  {
    id: 5,
    platform: 'Instagram',
    duration: '0:45',
    title: 'SD Mekar Sari Belajar Membuat Biopori & Memilah Sampah',
    description:
      'Edukasi pemilahan sampah sejak dini dan pembuatan lubang biopori oleh adik-adik sekolah dasar bersama fasilitator Teman Pilah.',
    date: '27 Sep 2026',
    thumbnail: '/activity/Pengmas (5).jpeg',
    videoUrl: 'https://www.instagram.com/temanpilah',
    aspect: 'tall',
    views: '1.5k tayangan',
    category: 'Edukasi Sekolah',
  },
  {
    id: 6,
    platform: 'YouTube',
    duration: '14:05',
    title: 'Dokumenter: Setahun Gerakan Bank Sampah Teman Pilah',
    description:
      'Perjalanan satu tahun memberdayakan warga dari pemilahan sampah di rumah hingga menjadi ekosistem ekonomi sirkular mandiri.',
    date: '20 Sep 2026',
    thumbnail: '/activity/Pengmas (6).jpeg',
    videoUrl: 'https://www.youtube.com',
    aspect: 'wide',
    views: '3.1k tayangan',
    category: 'Dokumenter',
  },
  {
    id: 7,
    platform: 'TikTok',
    duration: '1:15',
    title: '3 Jenis Sampah Plastik yang Paling Dicari di Bank Sampah',
    description:
      'Jangan buang botol PET dan wadah HDPE! Kenali jenis sampah plastik yang punya nilai tabungan paling tinggi di pos penimbangan kami.',
    date: '15 Sep 2026',
    thumbnail: '/activity/Pengmas (7).jpeg',
    videoUrl: 'https://www.tiktok.com',
    aspect: 'tall',
    views: '6.2k tayangan',
    category: 'Tips & Trik',
  },
  {
    id: 8,
    platform: 'Instagram',
    duration: '0:50',
    title: 'Penukaran Tabungan Sampah Menjadi Paket Sembako Warga',
    description:
      'Senangnya ibu-ibu warga dapat menukarkan saldo tabungan bank sampah dengan paket sembako minyak goreng dan beras secara langsung.',
    date: '10 Sep 2026',
    thumbnail: '/activity/Pengmas (8).jpeg',
    videoUrl: 'https://www.instagram.com/temanpilah',
    aspect: 'tall',
    views: '3.4k tayangan',
    category: 'Aksi Warga',
  },
  {
    id: 9,
    platform: 'YouTube',
    duration: '6:20',
    title: 'Tutorial Mengolah Minyak Jelantah Menjadi Lilin Ramah Lingkungan',
    description:
      'Langkah mudah daur ulang limbah minyak jelantah rumah tangga menjadi lilin aromaterapi ramah lingkungan bernilai jual tinggi.',
    date: '5 Sep 2026',
    thumbnail: '/activity/Pengmas (9).jpeg',
    videoUrl: 'https://www.youtube.com',
    aspect: 'wide',
    views: '1.8k tayangan',
    category: 'Daur Ulang',
  },
  {
    id: 10,
    platform: 'TikTok',
    duration: '0:42',
    title: 'Kenapa Sampah Harus Dipilah dari Rumah? Ini Alasannya!',
    description:
      'Fakta tentang kondisi TPA dan bagaimana 1 kebiasaan kecil memilah di dapur bisa menjaga lingkungan tetap asri dan sehat.',
    date: '1 Sep 2026',
    thumbnail: '/activity/Pengmas (10).jpeg',
    videoUrl: 'https://www.tiktok.com',
    aspect: 'tall',
    views: '8.9k tayangan',
    category: 'Tips & Trik',
  },
  {
    id: 11,
    platform: 'Instagram',
    duration: '1:05',
    title: 'Kolaborasi Bersih Lingkungan Bersama Komunitas Teman Pilah',
    description:
      'Aksi gotong royong warga dan relawan membersihkan fasilitas umum sekaligus menyortir sampah daur ulang secara serentak.',
    date: '25 Agu 2026',
    thumbnail: '/activity/Pengmas (11).jpeg',
    videoUrl: 'https://www.instagram.com/temanpilah',
    aspect: 'tall',
    views: '2.7k tayangan',
    category: 'Aksi Warga',
  },
  {
    id: 12,
    platform: 'YouTube',
    duration: '10:15',
    title: 'Workshop Pengomposan Sampah Organik Rumah Tangga',
    description:
      'Panduan lengkap membuat kompos dari sisa sayur dan daun kering menggunakan wadah sederhana tanpa menimbulkan bau menyengat.',
    date: '18 Agu 2026',
    thumbnail: '/activity/Pengmas (12).jpeg',
    videoUrl: 'https://www.youtube.com',
    aspect: 'wide',
    views: '2.5k tayangan',
    category: 'Edukasi & Workshop',
  },
];

