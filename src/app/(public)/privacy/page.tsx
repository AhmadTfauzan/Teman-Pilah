import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Database,
  Lock,
  Mail,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Container } from '@/components/layout/Container';
import { ConcentricCircles, OutlineLeaf } from '@/components/ui/DecorativeElements';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi | Teman Pilah',
  description:
    'Kebijakan privasi komunitas Teman Pilah mengenai pengelolaan informasi, layanan WhatsApp, dan transparansi data publik.',
};

const PRIVACY_SECTIONS = [
  {
    number: '01',
    title: 'Informasi yang Kami Kumpulkan',
    icon: Database,
    paragraphs: [
      'Situs publik Teman Pilah dapat diakses secara bebas untuk membaca materi edukasi lingkungan, memantau progres fermentasi Eco Enzyme, melihat katalog produk daur ulang, serta menonton dokumentasi Bank Sampah tanpa perlu membuat akun.',
      'Kami hanya menerima informasi pribadi apabila Anda secara sukarela menghubungi pengelola komunitas melalui WhatsApp atau email (seperti nama, nomor telepon, alamat email, maupun detail pemesanan produk atau pendaftaran nasabah Bank Sampah).',
      'Untuk kebutuhan teknis pengelola atau administrator yang masuk ke panel admin, browser dapat menyimpan token sesi dan preferensi URL label QR secara lokal di perangkat Anda (localStorage) agar fitur pengelolaan berjalan optimal.',
    ],
  },
  {
    number: '02',
    title: 'Penggunaan Informasi',
    icon: Users,
    paragraphs: [
      'Informasi yang Anda kirimkan melalui kanal komunikasi resmi hanya digunakan untuk merespons pertanyaan, memproses pesanan produk daur ulang, mengoordinasikan penimbangan Bank Sampah, serta mendukung kegiatan edukasi komunitas.',
      'Teman Pilah tidak menjual, menyewakan, atau memperdagangkan data kontak warga maupun pengunjung kepada pihak ketiga untuk kepentingan komersial atau periklanan.',
    ],
  },
  {
    number: '03',
    title: 'Layanan & Tautan Pihak Ketiga',
    icon: ShieldCheck,
    paragraphs: [
      'Halaman kami memuat pemutar video tersemat (seperti YouTube) serta tautan menuju platform eksternal seperti WhatsApp, Instagram, dan TikTok resmi komunitas. Ketika Anda berinteraksi dengan layanan eksternal tersebut, kebijakan privasi dan ketentuan masing-masing platform pihak ketiga turut berlaku.',
      'Data fermentasi Eco Enzyme yang ditampilkan pada halaman pelacak galon dan halaman detail QR bersifat publik untuk keperluan transparansi bahan (air, pemanis, dan jenis limbah organik) tanpa menampilkan data pribadi warga.',
    ],
  },
  {
    number: '04',
    title: 'Keamanan & Pembaruan Kebijakan',
    icon: Lock,
    paragraphs: [
      'Kami berupaya menjaga keamanan sistem situs web dan basis data komunitas dengan praktik pengamanan yang wajar untuk mencegah akses yang tidak sah.',
      'Kebijakan Privasi ini dapat diperbarui sewaktu-waktu seiring berkembangnya layanan komunitas Teman Pilah. Perubahan akan ditampilkan langsung pada halaman ini beserta tanggal pembaruan terbaru.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#3D3D3D]">
      {/* ─── HERO HEADER BANNER ─── */}
      <section className="relative overflow-hidden bg-[#012D1D] pt-20 pb-10 sm:pt-32 sm:pb-16 lg:pb-20 text-white">
        <div className="absolute -left-24 -top-24 opacity-25 pointer-events-none">
          <ConcentricCircles size={360} color="#0B4A31" />
        </div>
        <div className="hidden sm:block absolute -right-20 -bottom-24 opacity-25 pointer-events-none rotate-[25deg]">
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
            <span className="text-[#FC9634] font-semibold">Kebijakan Privasi</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-[#0B4A31] border border-[#3B9734]/40 px-3 sm:px-4 py-1 sm:py-1.5 text-[11px] sm:text-sm font-semibold text-[#80E478] mb-3 sm:mb-4">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Komitmen Perlindungan Data</span>
            </div>

            <h1 className="font-poppins font-bold text-2xl sm:text-4xl lg:text-5xl leading-tight text-white tracking-[-0.5px] sm:tracking-[-1px]">
              Kebijakan <span className="text-[#FC9634]">Privasi</span>
            </h1>

            <p className="font-poppins font-normal text-xs sm:text-lg text-[#C9D6CF] mt-2 sm:mt-3 leading-relaxed">
              Penjelasan transparan mengenai bagaimana komunitas Teman Pilah menghormati dan
              mengelola informasi pengunjung saat mengakses layanan digital kami.
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
                href="/terms"
                className="inline-flex items-center gap-2 rounded-full bg-[#FC9634]/15 hover:bg-[#FC9634]/25 border border-[#FC9634]/40 px-4 py-2 text-xs sm:text-sm font-semibold text-[#FC9634] transition-colors"
              >
                <span>Lihat Syarat &amp; Ketentuan</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ─── MAIN CONTENT ─── */}
      <section className="relative py-8 sm:py-14 lg:py-20 overflow-hidden">
        <div className="hidden sm:block absolute -right-24 top-20 opacity-20 pointer-events-none">
          <ConcentricCircles size={320} color="#FC9634" />
        </div>

        <Container className="relative z-10">
          <div className="max-w-4xl mx-auto space-y-5 sm:space-y-8">
            <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#E5E2DC] p-5 sm:p-8 shadow-sm">
              <p className="text-xs sm:text-base leading-relaxed text-[#3D3D3D]">
                Komunitas <strong className="text-[#012D1D]">Teman Pilah</strong> berkomitmen
                menjaga privasi setiap warga, mitra, dan pengunjung situs web{' '}
                <span className="font-semibold text-[#012D1D]">temanpilah.com</span>. Dokumen ini
                menjelaskan ruang lingkup informasi yang diproses saat Anda menggunakan fitur
                edukasi, katalog produk, dan pemantauan Eco Enzyme kami.
              </p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {PRIVACY_SECTIONS.map((section) => {
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
                          Bagian {section.number}
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

            {/* Contact Box */}
            <div className="rounded-2xl sm:rounded-3xl bg-[#012D1D] text-white p-5 sm:p-8 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#FC9634] block">
                  Pertanyaan Terkait Privasi
                </span>
                <h3 className="font-poppins font-bold text-lg sm:text-xl">
                  Hubungi Pengelola Teman Pilah
                </h3>
                <p className="text-xs sm:text-sm text-[#C9D6CF] leading-relaxed max-w-xl">
                  Jika Anda memiliki pertanyaan mengenai penggunaan data atau ingin memperbarui
                  informasi kontak yang pernah dikirimkan, silakan hubungi tim kami.
                </p>
              </div>

              <div className="flex flex-wrap sm:flex-col gap-2.5 shrink-0">
                <a
                  href="mailto:halo@temanpilah.com"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FC9634] hover:bg-[#e8801a] text-[#012D1D] font-bold text-xs sm:text-sm px-5 py-2.5 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>halo@temanpilah.com</span>
                </a>
                <Link
                  href="/#kontak"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 transition-colors"
                >
                  <span>Lihat Kontak Lengkap</span>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
