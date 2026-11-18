import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileText,
  Scale,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { ConcentricCircles, OutlineLeaf } from '@/components/ui/DecorativeElements';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan | Teman Pilah',
  description:
    'Syarat dan ketentuan penggunaan platform informasi, pusat edukasi, katalog produk daur ulang, dan pelacak Eco Enzyme Teman Pilah.',
};

const TERMS_SECTIONS = [
  {
    number: '01',
    title: 'Penerimaan Ketentuan',
    icon: FileText,
    paragraphs: [
      'Dengan mengakses dan menggunakan situs web Teman Pilah, Anda dianggap telah membaca, memahami, dan menyetujui Syarat & Ketentuan ini. Apabila Anda tidak menyetujui ketentuan di bawah ini, mohon untuk tidak menggunakan layanan situs web kami.',
      'Platform ini dikelola sebagai media informasi, edukasi lingkungan, transparansi fermentasi Eco Enzyme, dokumentasi Bank Sampah, serta katalog produk hasil pemberdayaan komunitas Teman Pilah.',
    ],
  },
  {
    number: '02',
    title: 'Penggunaan Materi Edukasi & Informasi Eco Enzyme',
    icon: BookOpen,
    paragraphs: [
      'Seluruh artikel, panduan Prinsip 3R, serta informasi rasio fermentasi Eco Enzyme 1:3:10 disediakan untuk tujuan edukasi lingkungan dan pemberdayaan masyarakat.',
      'Anda diperbolehkan membaca, mengunduh versi cetak/PDF materi edukasi, dan membagikan ulang untuk kegiatan non-komersial dengan tetap mencantumkan kredit sumber Teman Pilah. Praktik pembuatan Eco Enzyme maupun kompos di rumah tangga tetap memerlukan ketelitian pengguna terhadap kebersihan wadah dan bahan.',
    ],
  },
  {
    number: '03',
    title: 'Katalog Produk & Pemesanan via WhatsApp',
    icon: ShoppingBag,
    paragraphs: [
      'Informasi harga, stok, dan deskripsi produk pada halaman katalog maupun detail QR produk dapat berubah sewaktu-waktu menyesuaikan ketersediaan hasil produksi komunitas.',
      'Konfirmasi pemesanan, metode pembayaran, dan pengambilan atau pengiriman barang dilakukan secara langsung melalui komunikasi resmi WhatsApp pengelola Teman Pilah.',
    ],
  },
  {
    number: '04',
    title: 'Ketentuan Penggunaan yang Wajar & Tanggung Jawab',
    icon: Scale,
    paragraphs: [
      'Pengguna dilarang menyalahgunakan situs web ini, termasuk mencoba mengakses area admin tanpa otorisasi, mengganggu ketersediaan server, atau memalsukan tautan dan kode QR resmi Teman Pilah.',
      'Teman Pilah berupaya menyajikan data yang akurat dan mutakhir, namun tidak bertanggung jawab atas gangguan teknis di luar kendali wajar maupun konten pada situs pihak ketiga yang tertaut dari halaman ini.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#3D3D3D]">
      {/* ─── HERO HEADER BANNER ─── */}
      <section className="relative overflow-hidden bg-[#012D1D] pt-20 pb-10 sm:pt-32 sm:pb-16 lg:pb-20 text-white">
        <div className="absolute -right-24 -top-24 opacity-25 pointer-events-none">
          <ConcentricCircles size={360} color="#0B4A31" />
        </div>
        <div className="hidden sm:block absolute -left-20 -bottom-24 opacity-25 pointer-events-none rotate-[-20deg]">
          <OutlineLeaf size={380} color="#203220" strokeWidth={6.72} />
        </div>

        <Container className="relative z-10">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#C9D6CF] font-poppins mb-4 sm:mb-6"
          >
            <Link href="/" className="hover:text-white transition-colors">
              Beranda
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-[#FC9634] font-semibold">Syarat &amp; Ketentuan</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-[#0B4A31] border border-[#3B9734]/40 px-3 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-sm font-semibold text-[#80E478] mb-3 sm:mb-4">
              <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Aturan Penggunaan Platform</span>
            </div>

            <h1 className="font-poppins font-bold text-2xl sm:text-4xl lg:text-5xl leading-tight text-white tracking-[-0.5px] sm:tracking-[-1px]">
              Syarat &amp; <span className="text-[#FC9634]">Ketentuan</span>
            </h1>

            <p className="font-poppins font-normal text-xs sm:text-lg text-[#C9D6CF] mt-2 sm:mt-3 leading-relaxed">
              Pedoman penggunaan layanan informasi, materi edukasi lingkungan, serta katalog produk
              komunitas Teman Pilah.
            </p>

            <div className="pt-4 sm:pt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Kembali ke Beranda</span>
              </Link>
              <Link
                href="/privacy"
                className="inline-flex items-center gap-2 rounded-full bg-[#FC9634]/15 hover:bg-[#FC9634]/25 border border-[#FC9634]/40 px-4 py-2 text-xs sm:text-sm font-semibold text-[#FC9634] transition-colors"
              >
                <span>Baca Kebijakan Privasi</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── MAIN CONTENT ─── */}
      <section className="relative py-8 sm:py-14 lg:py-20 overflow-hidden">
        <div className="hidden sm:block absolute -left-24 top-20 opacity-20 pointer-events-none">
          <ConcentricCircles size={320} color="#FC9634" />
        </div>

        <Container className="relative z-10">
          <div className="max-w-4xl mx-auto space-y-5 sm:space-y-8">
            <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#E5E2DC] p-5 sm:p-8 shadow-sm">
              <p className="text-xs sm:text-base leading-relaxed text-[#3D3D3D]">
                Halaman ini mengatur ketentuan penggunaan seluruh layanan digital{' '}
                <strong className="text-[#012D1D]">Teman Pilah</strong>. Ketentuan dapat diperbarui
                secara berkala sesuai perkembangan program pemberdayaan masyarakat dan layanan
                komunitas.
              </p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {TERMS_SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <article
                    key={section.number}
                    className="rounded-2xl sm:rounded-3xl bg-white border border-[#E5E2DC] p-5 sm:p-8 shadow-sm hover:border-[#012D1D]/30 transition-colors"
                  >
                    <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#012D1D] text-[#FC9634] flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase text-[#3B9734] block">
                          Pasal {section.number}
                        </span>
                        <h2 className="font-poppins font-bold text-base sm:text-xl lg:text-2xl text-[#012D1D]">
                          {section.title}
                        </h2>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs sm:text-[15px] leading-relaxed text-[#42493E] sm:pl-16">
                      {section.paragraphs.map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Footer CTA */}
            <div className="rounded-2xl sm:rounded-3xl bg-[#012D1D] text-white p-5 sm:p-8 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 text-[11px] uppercase font-bold tracking-wider text-[#FC9634]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Kolaborasi &amp; Masukan</span>
                </span>
                <h3 className="font-poppins font-bold text-lg sm:text-xl">
                  Butuh Klarifikasi Lebih Lanjut?
                </h3>
                <p className="text-xs sm:text-sm text-[#C9D6CF] leading-relaxed max-w-xl">
                  Tim Teman Pilah terbuka untuk pertanyaan seputar kemitraan program, pemilahan
                  sampah, maupun pemanfaatan materi edukasi di sekolah dan komunitas.
                </p>
              </div>

              <div className="flex flex-wrap sm:flex-col gap-2.5 shrink-0">
                <Link
                  href="/#kontak"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FC9634] hover:bg-[#e8801a] text-[#012D1D] font-bold text-xs sm:text-sm px-5 py-2.5 transition-colors"
                >
                  <span>Hubungi Kami</span>
                </Link>
                <Link
                  href="/edukasi"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 transition-colors"
                >
                  <span>Jelajahi Edukasi</span>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
