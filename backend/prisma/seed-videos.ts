import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const initialVideos = [
  {
    title: "Kunjungan Mahasiswa Telkom University ke Bank Sampah Teman Pilah",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    platform: "YouTube",
    duration: "8:42",
    thumbnail: "/activity/Pengmas (1).jpeg",
    description: "Dokumentasi kunjungan dan observasi langsung sistem penimbangan serta tabungan digital Bank Sampah Teman Pilah oleh tim mahasiswa Telkom University Jakarta.",
    category: "Edukasi & Kunjungan",
    aspect: "wide",
    sortOrder: 1,
  },
  {
    title: "Cara Memilah Sampah Rumah Tangga dalam 60 Detik",
    videoUrl: "https://www.tiktok.com/@temanpilah",
    platform: "TikTok",
    duration: "0:58",
    thumbnail: "/activity/Pengmas (2).jpeg",
    description: "Tips cepat dan praktis memisahkan sampah anorganik siap setor ke Bank Sampah agar bernilai ekonomis dan mudah didaur ulang.",
    category: "Tips & Trik",
    aspect: "tall",
    sortOrder: 2,
  },
  {
    title: "Panen Eco Enzyme bersama Ibu-ibu RW 05",
    videoUrl: "https://www.instagram.com/temanpilah",
    platform: "Instagram",
    duration: "1:24",
    thumbnail: "/activity/Pengmas (4).jpeg",
    description: "Serunya kegiatan panen eco enzyme fermentasi 90 hari bersama warga Bank Sampah Teman Pilah untuk pembersih alami ramah lingkungan.",
    category: "Aksi Warga",
    aspect: "tall",
    sortOrder: 3,
  },
  {
    title: "Penimbangan Rutin Bank Sampah Mandiri & Tukar Tabungan",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    platform: "YouTube",
    duration: "3:10",
    thumbnail: "/activity/Pengmas (3).jpeg",
    description: "Aksi penimbangan berkala setiap minggu di posko Bank Sampah. Sampah anorganik terpilah ditimbang dan langsung dicatat ke buku tabungan warga.",
    category: "Penimbangan",
    aspect: "wide",
    sortOrder: 4,
  },
  {
    title: "SD Mekar Sari Belajar Membuat Biopori & Memilah Sampah",
    videoUrl: "https://www.instagram.com/temanpilah",
    platform: "Instagram",
    duration: "0:45",
    thumbnail: "/activity/Pengmas (5).jpeg",
    description: "Edukasi pemilahan sampah sejak dini dan pembuatan lubang biopori oleh adik-adik sekolah dasar bersama fasilitator Teman Pilah.",
    category: "Edukasi Sekolah",
    aspect: "tall",
    sortOrder: 5,
  },
  {
    title: "Dokumenter: Setahun Gerakan Bank Sampah Teman Pilah",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    platform: "YouTube",
    duration: "14:05",
    thumbnail: "/activity/Pengmas (6).jpeg",
    description: "Perjalanan satu tahun memberdayakan warga dari pemilahan sampah di rumah hingga menjadi ekosistem ekonomi sirkular mandiri.",
    category: "Dokumenter",
    aspect: "wide",
    sortOrder: 6,
  },
];

async function seedVideos() {
  console.log("Seeding Bank Sampah Videos...");
  for (const v of initialVideos) {
    await prisma.bankSampahVideo.create({
      data: v,
    });
  }
  console.log("Seeded " + initialVideos.length + " videos successfully.");
  process.exit(0);
}

seedVideos().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});

