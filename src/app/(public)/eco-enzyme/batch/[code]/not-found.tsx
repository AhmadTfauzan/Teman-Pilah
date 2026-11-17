import React from 'react';
import Link from 'next/link';
import {
  FlaskConical,
  ArrowLeft,
  BookOpen,
  MessageCircle,
  HelpCircle,
  Search,
} from 'lucide-react';

const COMMUNITY_WHATSAPP = '6281234567890';

export default function BatchNotFound() {
  return (
    <div className="min-h-screen bg-[#F8F6F1] pt-20 pb-12 sm:pt-28 sm:pb-20 px-3 sm:px-6 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto text-center bg-white p-5 sm:p-9 rounded-2xl sm:rounded-3xl border border-[#E3E8DC] shadow-lg space-y-4 sm:space-y-6">
        
        {/* ICON */}
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mx-auto shadow-sm">
          <FlaskConical className="w-8 h-8" />
        </div>

        {/* HEADLINE & EXPLANATION */}
        <div className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            QR / URL Tidak Valid
          </span>
          <h2 className="text-2xl font-black text-[#1A2F1D]">Kode Batch Tidak Ditemukan</h2>
          <p className="text-xs sm:text-sm text-[#586154] leading-relaxed">
            Kode batch Eco Enzyme yang Anda tuju tidak terdaftar di sistem Teman Pilah.
          </p>
        </div>

        {/* HELPFUL TIPS BOX */}
        <div className="bg-[#FAFBF9] p-4 rounded-2xl border border-[#E3E8DC] text-left text-xs space-y-2 text-[#4A5546]">
          <div className="flex items-center gap-1.5 font-bold text-stone-800">
            <HelpCircle className="w-4 h-4 text-emerald-700" />
            <span>Saran pemeriksaan label fisik galon:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-[11px] text-[#586154]">
            <li>Pastikan stiker QR Code pada galon tidak tergores, basah, atau terlipat.</li>
            <li>Jika mengetik kode manual, periksa kembali huruf dan angka pada stiker.</li>
            <li>Pastikan Anda memindai kode QR resmi berlogo <strong>Teman Pilah</strong>.</li>
          </ul>
        </div>

        {/* NAVIGATION ACTIONS */}
        <div className="pt-1 flex flex-col gap-2.5">
          <Link
            href="/eco-enzyme"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#2C5F2D] hover:bg-[#234d24] text-white text-xs font-bold rounded-xl shadow-md transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Buka Live Tracker Eco Enzyme
          </Link>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/eco-enzyme#kalkulator"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Panduan Pembuatan
            </Link>

            <a
              href={`https://wa.me/${COMMUNITY_WHATSAPP}?text=${encodeURIComponent(
                'Halo komunitas Teman Pilah, saya memindai QR galon Eco Enzyme namun kodenya tidak ditemukan. Mohon bantuannya.'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Tanya Relawan
            </a>
          </div>

          <Link
            href="/"
            className="text-[11px] text-stone-400 hover:text-stone-600 font-medium pt-1 transition-colors"
          >
            Kembali ke Beranda Teman Pilah
          </Link>
        </div>

      </div>
    </div>
  );
}
