import React from 'react';
import { CalendarDays, Link as LinkIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { OutlineLeaf, ConcentricCircles } from '@/components/ui/DecorativeElements';

export default function Prinsip3RDetail() {
  return (
    <div className="pt-20 md:pt-[88px] min-h-screen bg-[#FAFAF8] relative overflow-hidden">
      {/* Decorative Brand Accents (Figma Frame 48) */}
      <div className="absolute -right-24 top-40 opacity-20 pointer-events-none rotate-[20deg]">
        <OutlineLeaf size={340} color="#203220" strokeWidth={6.72} />
      </div>
      <div className="absolute -left-20 bottom-32 opacity-25 pointer-events-none">
        <ConcentricCircles size={300} color="#FC9634" />
      </div>
      {/* HERO IMAGE */}
      <div className="w-full h-[190px] sm:h-[250px] md:h-[450px] relative overflow-hidden bg-[#e0e5db]">
        <img
          src="https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=2000"
          alt="Edukasi Lingkungan"
          className="w-full h-full object-cover opacity-90"
        />
        {/* Overlay pattern to simulate the screenshot's texture */}
        <div className="absolute inset-0 bg-black/10 mix-blend-multiply"></div>
      </div>

      {/* ARTICLE CONTENT */}
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-7 sm:py-12 md:py-16">

        {/* TAGS */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
          <span className="px-3 py-1 sm:px-4 sm:py-1.5 bg-[#DCFCE7] text-[#166534] rounded-full text-xs sm:text-[13px] font-bold tracking-wide">
            Daur Ulang
          </span>
          <span className="px-3 py-1 sm:px-4 sm:py-1.5 bg-[#DCFCE7] text-[#166534] rounded-full text-xs sm:text-[13px] font-bold tracking-wide">
            Edukasi
          </span>
          <span className="px-3 py-1 sm:px-4 sm:py-1.5 bg-[#DCFCE7] text-[#166534] rounded-full text-xs sm:text-[13px] font-bold tracking-wide">
            Lingkungan
          </span>
        </div>

        {/* TITLE */}
        <h1 className="text-2xl sm:text-[32px] md:text-[44px] font-extrabold text-[#1a2f1d] leading-tight mb-4 sm:mb-6">
          Prinsip 3R: Kunci Gaya Hidup Berkelanjutan
        </h1>

        {/* METADATA */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-[14px] text-[#616b5a] font-medium mb-6 sm:mb-10 pb-5 sm:pb-8 border-b border-[#e5e7e0]">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-[#8c9685] sm:w-[18px] sm:h-[18px]" />
            <span>Dipublikasikan pada: 12 Mei 2024</span>
          </div>
          <div className="flex items-center gap-2">
            <LinkIcon size={16} className="text-[#8c9685] sm:w-[18px] sm:h-[18px]" />
            <span>temanpilah.com/edukasi/prinsip-3r</span>
          </div>
        </div>

        {/* QUOTE BOX */}
        <div className="bg-[#E8F5E9] border-l-[4px] sm:border-l-[6px] border-[#1a2f1d] p-4 sm:p-6 md:p-8 mb-8 sm:mb-12 rounded-r-2xl">
          <p className="text-[#1a2f1d] font-bold text-[15px] sm:text-[18px] md:text-[20px] leading-relaxed italic">
            "Prinsip 3R (Reduce, Reuse, Recycle) adalah landasan utama dalam pengelolaan sampah yang efektif dan berkelanjutan untuk menjaga kelestarian ekosistem bumi kita."
          </p>
        </div>

        {/* SUBTITLE */}
        <h2 className="text-xl sm:text-[26px] md:text-[28px] font-bold text-[#166534] mb-4 sm:mb-6">
          Mengurangi Jejak dari Akar Permasalahan
        </h2>

        {/* BODY TEXT */}
        <div className="space-y-4 sm:space-y-6 text-[#42493E] text-sm sm:text-[16px] md:text-[17px] leading-[1.75] sm:leading-[1.8] tracking-wide">
          <p>
            Strategi pertama dan paling fundamental dalam menjaga kelestarian bumi adalah melalui pengurangan konsumsi atau <strong className="text-[#1a2f1d] font-bold">Reduce</strong>. Pendekatan ini dianggap sebagai pilar terpenting karena ia memotong masalah langsung dari akarnya. Overkonsumsi global saat ini telah menyebabkan eksploitasi sumber daya alam yang masif, emisi karbon tinggi dari proses produksi yang tak henti, serta penumpukan sampah yang semakin sulit dikelola. Dengan secara sadar mengurangi apa yang kita beli dan gunakan, kita secara langsung menurunkan jejak karbon individu kita sebelum sampah itu sendiri tercipta.
          </p>

          <p>
            Dalam praktik sehari-hari, langkah pengurangan nyata dapat dimulai dengan memilih produk dengan kemasan minimalis atau yang dapat dikomposkan guna menghindari plastik berlapis-lapis. Selain itu, beralih ke botol minum reusable dan mendigitalisasi dokumen penting bukan hanya sekadar tren, melainkan aksi nyata untuk menghemat ribuan botol plastik dan sumber daya hutan setiap tahunnya. Kuncinya terletak pada mindful shopping: membiasakan diri untuk bertanya, "Apakah saya benar-benar membutuhkannya?" sebelum melakukan transaksi apa pun.
          </p>

          <p>
            Setelah berupaya mengurangi konsumsi, langkah selanjutnya adalah memaksimalkan penggunaan barang yang sudah kita miliki melalui prinsip <strong className="text-[#1a2f1d] font-bold">Reuse</strong>. Konsep ini bertujuan menggeser paradigma lama dari ekonomi linier yang bersifat "ambil-pakai-buang" menuju model Ekonomi Sirkular yang lebih berkelanjutan. Di sini, nilai sebuah barang tidak berakhir setelah fungsi utamanya selesai; sebaliknya, nilai tersebut dipertahankan selama mungkin melalui perawatan yang baik, perbaikan yang telaten, serta kreativitas tanpa batas.
          </p>

          <p>
            Banyak cara kreatif untuk menghidupkan kembali barang lama di rumah kita. Misalnya, upcycling tekstil dengan mengubah kaos katun lama menjadi tas belanja ramah lingkungan, atau membersihkan toples kaca bekas selai untuk dijadikan wadah bumbu dapur yang estetik. Bahkan untuk perangkat elektronik, perbaikan kecil seringkali lebih bijak daripada membeli yang baru. Jika suatu barang memang sudah tidak lagi kita butuhkan, menyalurkannya melalui platform donasi adalah cara mulia untuk memastikan barang tersebut tetap memiliki masa pakai yang panjang di tangan orang lain.
          </p>

          <p>
            <strong className="text-[#1a2f1d] font-bold">Recycle</strong> atau daur ulang merupakan benteng pertahanan terakhir dalam hirarki pengelolaan sampah. Meskipun sangat krusial, daur ulang hanya akan efektif jika didukung oleh sistem pemilahan yang tepat sejak dari sumbernya—yaitu rumah tangga kita sendiri. Sampah yang tercampur antara organik dan anorganik akan sangat sulit, bahkan mustahil, untuk diproses secara industri dan akhirnya hanya akan berakhir menumpuk di Tempat Pemrosesan Akhir (TPA).
          </p>

          <p>
            Menerapkan prinsip 3R bukan berarti kita harus sempurna dalam semalam. Perubahan besar dimulai dari tindakan-tindakan kecil yang dilakukan secara konsisten oleh banyak orang. Setiap botol yang tidak dibeli, setiap barang yang diperbaiki, dan setiap sampah yang dipilah adalah kontribusi nyata bagi bumi yang lebih hijau. Mari menjadi bagian dari solusi, bukan polusi.
          </p>
        </div>

        {/* BOTTOM BUTTON */}
        <div className="mt-8 sm:mt-14 mb-4 sm:mb-8">
          <Button className="bg-[#1a2f1d] hover:bg-[#234926] text-white rounded-full px-5 py-4 sm:px-7 sm:py-[26px] text-xs sm:text-[15px] font-bold flex items-center gap-2.5 sm:gap-3 transition-all hover:scale-105 active:scale-95 shadow-md">
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            Download Materi Edukasi Lengkap
          </Button>
        </div>

      </div>
    </div>
  );
}
