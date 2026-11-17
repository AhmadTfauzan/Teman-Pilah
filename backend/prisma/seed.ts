import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma";

async function main() {
  const adminEmail = "admin@temanpilah.com";
  const adminPassword = "password123";
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  console.log("Seeding started...");

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Super Admin",
      password: hashedPassword,
    },
  });

  console.log({ admin });

  const educationData = [
    {
      title: "Panduan Memilah Sampah Rumah Tangga",
      slug: "panduan-memilah-sampah-rumah-tangga",
      overview:
        "Pelajari cara mudah memilah sampah rumah tangga berdasarkan jenisnya untuk mendukung daur ulang dan mengurangi limbah.",
      description:
        "Memilah sampah rumah tangga adalah langkah awal yang penting dalam pengelolaan limbah. Dengan memisahkan sampah organik, anorganik, dan limbah B3, kita dapat memudahkan proses daur ulang dan mengurangi beban Tempat Pembuangan Akhir (TPA). Sampah organik seperti sisa makanan dan daun dapat diolah menjadi kompos, sementara sampah anorganik seperti plastik, kertas, dan logam dapat didaur ulang menjadi produk baru. Limbah B3 seperti baterai dan obat-obatan kadaluarsa memerlukan penanganan khusus agar tidak mencemari lingkungan. Mulailah dengan menyediakan tempat sampah terpisah di rumah dan biasakan anggota keluarga untuk membuang sampah sesuai kategorinya.",
      tags: ["sampah", "daur ulang", "rumah tangga", "panduan"],
      status: "PUBLISHED" as const,
      publishDate: new Date("2026-01-15"),
    },
    {
      title: "Cara Mengolah Sampah Organik Menjadi Kompos",
      slug: "cara-mengolah-sampah-organik-menjadi-kompos",
      overview:
        "Ubah sisa sayuran dan daun kering menjadi kompos berkualitas dengan metode sederhana yang bisa dilakukan di rumah.",
      description:
        "Pengomposan adalah proses alami mengubah sampah organik menjadi pupuk kaya nutrisi. Metode yang paling mudah dilakukan di rumah adalah komposter tabung atau lubang biopori. Bahan yang dibutuhkan terdiri dari sampah organik basah (sisa sayur, buah, ampas kopi) dan sampah organik kering (daun kering, serbuk gergaji) dengan perbandingan 1:2. Pastikan kelembaban dijaga dan diaduk setiap 3-7 hari untuk sirkulasi udara. Dalam waktu 4-6 minggu, kompos siap digunakan untuk menyuburkan tanaman di pekarangan rumah. Selain mengurangi sampah yang dibuang ke TPA, kompos juga menghemat pengeluaran untuk pupuk kimia.",
      tags: ["kompos", "organik", "berkebun", "pupuk"],
      status: "PUBLISHED" as const,
      publishDate: new Date("2026-02-20"),
    },
    {
      title: "Kreatif Mendaur Ulang Plastik Bekas",
      slug: "kreatif-mendaur-ulang-plastik-bekas",
      overview:
        "Inspirasi mengubah sampah plastik menjadi barang berguna dan bernilai estetis melalui teknik daur ulang kreatif.",
      description:
        "Sampah plastik menjadi salah satu masalah lingkungan terbesar saat ini. Namun, dengan sedikit kreativitas, botol plastik bekas, kemasan deterjen, dan kantong plastik dapat disulap menjadi barang bernilai guna. Botol plastik bisa menjadi pot tanaman gantung, tempat alat tulis, atau lampu hias. Kemasan deterjen dapat diubah menjadi celengan atau tempat penyimpanan. Teknik ecobrick juga menjadi solusi inovatif dengan memasukkan sampah plastik ke dalam botol untuk dijadikan bahan bangunan alternatif seperti kursi, meja, atau taman vertikal. Kegiatan daur ulang kreatif tidak hanya mengurangi limbah tetapi juga dapat menjadi sumber penghasilan tambahan.",
      tags: ["plastik", "daur ulang", "kreatif", "ecobrick"],
      status: "PUBLISHED" as const,
      publishDate: new Date("2026-03-10"),
    },
    {
      title: "Mengenal Konsep Zero Waste untuk Pemula",
      slug: "mengenal-konsep-zero-waste-untuk-pemula",
      overview:
        "Pengantar gaya hidup tanpa sampah dengan prinsip 5R: Refuse, Reduce, Reuse, Recycle, Rot yang mudah diterapkan sehari-hari.",
      description:
        "Zero waste adalah filosofi yang mendorong kita untuk meminimalkan produksi sampah sebanyak mungkin. Prinsip utamanya dikenal dengan 5R: Refuse (menolak barang sekali pakai), Reduce (mengurangi konsumsi), Reuse (menggunakan kembali), Recycle (mendaur ulang), dan Rot (mengompos). Untuk pemula, mulailah dengan langkah kecil: bawa tas belanja sendiri, gunakan botol minum isi ulang, tolak sedotan plastik, dan beli produk dengan kemasan minimal. Zero waste bukan tentang kesempurnaan, melainkan tentang melakukan yang terbaik sesuai kemampuan. Setiap langkah kecil yang konsisten akan memberikan dampak positif bagi lingkungan.",
      tags: ["zero waste", "gaya hidup", "ramah lingkungan", "pemula"],
      status: "DRAFT" as const,
      publishDate: null,
    },
    {
      title: "Manfaat Bank Sampah bagi Lingkungan dan Ekonomi",
      slug: "manfaat-bank-sampah-bagi-lingkungan-dan-ekonomi",
      overview:
        "Bank sampah bukan hanya solusi lingkungan tetapi juga memberdayakan ekonomi masyarakat melalui tabungan sampah.",
      description:
        "Bank sampah adalah sistem pengelolaan sampah berbasis masyarakat yang menerapkan prinsip 3R (Reduce, Reuse, Recycle). Nasabah menyetorkan sampah yang sudah dipilah ke bank sampah dan mendapat imbalan berupa uang atau tabungan. Sampah anorganik seperti plastik, kertas, kaca, dan logam memiliki nilai ekonomi yang bervariasi. Selain memberikan penghasilan tambahan bagi masyarakat, bank sampah juga mengurangi volume sampah yang berakhir di TPA, menciptakan lingkungan yang lebih bersih, dan membangun kesadaran kolektif akan pentingnya pengelolaan sampah. Saat ini sudah ribuan bank sampah aktif di seluruh Indonesia yang melibatkan ibu rumah tangga, pemuda, dan komunitas.",
      tags: ["bank sampah", "ekonomi", "masyarakat", "3R"],
      status: "PUBLISHED" as const,
      publishDate: new Date("2026-04-05"),
    },
  ];

  console.log("Seeding education content...");

  for (const data of educationData) {
    const education = await prisma.educationContent.upsert({
      where: { slug: data.slug },
      update: {},
      create: { ...data, thumbnail: null },
    });
    console.log(`  Created: ${education.title}`);
  }

  console.log("Seeding eco enzyme batches...");
  const today = new Date();

  // Cari produk sabun untuk relasi alokasi
  const soapProduct = await prisma.product.findFirst({
    where: { category: "ORGANIC" },
  });
  
  // Batch 1: Fermentasi Berjalan (30 hari lalu)
  const date30DaysAgo = new Date(today);
  date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
  const estimate1 = new Date(date30DaysAgo);
  estimate1.setDate(estimate1.getDate() + 89);

  const batch1 = await prisma.ecoEnzymeBatch.upsert({
    where: { batchCode: "EE-202609-001" },
    update: {},
    create: {
      publicCode: "EE-2609-X7K9P2",
      batchCode: "EE-202609-001",
      containerName: "Drum Biru A1 (60L)",
      containerCapacityLiter: 60.0,
      molassesKg: 3.0,
      organicWasteKg: 9.0,
      waterLiter: 30.0,
      organicWasteTypes: "Kulit Nanas, Kulit Jeruk, Kulit Pepaya, Kulit Pisang",
      startDate: date30DaysAgo,
      harvestEstimate: estimate1,
      status: "IN_PROGRESS",
      notes: "Menggunakan molase tebu murni kualitas grade A dari produsen lokal.",
      inspectionLogs: {
        create: [
          {
            dayNumber: 7,
            logDate: new Date(date30DaysAgo.getTime() + 7 * 24 * 60 * 60 * 1000),
            phLevel: 4.2,
            aromaStatus: "Asam Segar Khas Buah",
            fungusColor: "Lapisan jamur putih tipis (mama enzim)",
            actionTaken: "Buka tutup wadah sebentar untuk membuang akumulasi gas CO2",
            notes: "Fermentasi berjalan optimal, aroma buah harum tidak ada bau busuk",
          },
          {
            dayNumber: 25,
            logDate: new Date(date30DaysAgo.getTime() + 25 * 24 * 60 * 60 * 1000),
            phLevel: 3.8,
            aromaStatus: "Aroma Alkohol/Fermentasi",
            fungusColor: "Mama enzim semakin menebal dan bersih",
            actionTaken: "Aduk perlahan permukaan bahan dan rapatkan kembali tutup wadah",
            notes: "Kondisi sangat baik, tidak ditemukan jamur hitam atau belatung",
          },
        ],
      },
    },
  });
  console.log(`  Created batch: ${batch1.batchCode}`);

  // Batch 2: Siap Panen (95 hari lalu)
  const date95DaysAgo = new Date(today);
  date95DaysAgo.setDate(date95DaysAgo.getDate() - 95);
  const estimate2 = new Date(date95DaysAgo);
  estimate2.setDate(estimate2.getDate() + 89);

  const batch2 = await prisma.ecoEnzymeBatch.upsert({
    where: { batchCode: "EE-202607-002" },
    update: {},
    create: {
      publicCode: "EE-2607-M3N8R5",
      batchCode: "EE-202607-002",
      containerName: "Drum Kuning B2 (100L)",
      containerCapacityLiter: 100.0,
      molassesKg: 5.0,
      organicWasteKg: 15.0,
      waterLiter: 50.0,
      organicWasteTypes: "Kulit Jeruk Nipis, Semangka, Kulit Apel",
      startDate: date95DaysAgo,
      harvestEstimate: estimate2,
      status: "IN_PROGRESS",
      notes: "Target panen disiapkan untuk workshop edukasi pengmas.",
    },
  });
  console.log(`  Created batch: ${batch2.batchCode}`);

  // Batch 3: Sudah Panen
  const date120DaysAgo = new Date(today);
  date120DaysAgo.setDate(date120DaysAgo.getDate() - 120);
  const estimate3 = new Date(date120DaysAgo);
  estimate3.setDate(estimate3.getDate() + 89);

  const batch3 = await prisma.ecoEnzymeBatch.upsert({
    where: { batchCode: "EE-202606-003" },
    update: {},
    create: {
      publicCode: "EE-2606-B4T6W9",
      batchCode: "EE-202606-003",
      containerName: "Jerigen Hijau C1 (40L)",
      containerCapacityLiter: 40.0,
      molassesKg: 2.5,
      organicWasteKg: 7.5,
      waterLiter: 25.0,
      organicWasteTypes: "Kulit Jeruk, Nanas, Mangga",
      startDate: date120DaysAgo,
      harvestEstimate: estimate3,
      actualHarvestDate: estimate3,
      harvestLiter: 22.0,
      efficiencyRatePercent: 62.86,
      residueUsage: "KOMPOS_PADAT",
      residueNotes: "5 kg ampas dikeringkan dan diolah menjadi kompos padat untuk kebun toga.",
      allocatedProductId: soapProduct ? soapProduct.id : null,
      allocatedUnitsAdded: soapProduct ? 15 : 0,
      status: "HARVESTED",
      notes: "Panen sukses. Cairan bening cokelat pekat pH 3.4. Dialokasikan untuk produksi sabun.",
    },
  });
  console.log(`  Created batch: ${batch3.batchCode}`);

  console.log("Seeding finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
