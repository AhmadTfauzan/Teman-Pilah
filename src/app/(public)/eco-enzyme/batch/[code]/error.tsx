'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, ArrowLeft, MessageCircle } from 'lucide-react';

const COMMUNITY_WHATSAPP = '6281234567890';

export default function BatchDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#F8F6F1] pt-20 pb-12 sm:pt-28 sm:pb-20 px-3 sm:px-6 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto text-center bg-white p-5 sm:p-9 rounded-2xl sm:rounded-3xl border border-[#E3E8DC] shadow-lg space-y-4 sm:space-y-6">
        
        {/* ICON */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 mx-auto shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>

        {/* HEADLINE */}
        <div className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
            Koneksi Terkendala
          </span>
          <h2 className="text-2xl font-black text-[#1A2F1D]">Gagal Memuat Data Batch</h2>
          <p className="text-xs sm:text-sm text-[#586154] leading-relaxed">
            Terjadi gangguan saat mengambil status fermentasi terkini dari server. Silakan coba beberapa saat lagi.
          </p>
        </div>

        {/* ACTIONS */}
        <div className="pt-2 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#2C5F2D] hover:bg-[#234d24] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Lagi
          </button>

          <Link
            href="/eco-enzyme"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Hub Eco Enzyme
          </Link>

          <a
            href={`https://wa.me/${COMMUNITY_WHATSAPP}?text=${encodeURIComponent(
              'Halo tim Teman Pilah, saya mengalami kendala koneksi saat membuka halaman batch Eco Enzyme.'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 text-[11px] text-emerald-800 hover:text-emerald-900 font-semibold pt-1"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Laporkan Masalah ke Relawan
          </a>
        </div>

      </div>
    </div>
  );
}
