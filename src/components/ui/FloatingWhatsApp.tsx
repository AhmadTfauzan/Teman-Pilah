'use client';

import React from 'react';

interface FloatingWhatsAppProps {
  phoneNumber?: string;
  message?: string;
  className?: string;
}

export function FloatingWhatsApp({
  phoneNumber = '6281234567890',
  message = 'Halo Teman Pilah! Saya ingin bertanya seputar kegiatan dan program Teman Pilah.',
  className = '',
}: FloatingWhatsAppProps) {
  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <aside
      aria-label="Kontak Cepat WhatsApp"
      className={`fixed right-4 md:right-8 z-40 transition-all duration-300 ${className}`}
      style={{
        bottom: 'calc(4rem + 12px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <style jsx>{`
        @media (min-width: 768px) {
          aside {
            bottom: calc(2rem + env(safe-area-inset-bottom, 0px)) !important;
          }
        }
      `}</style>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hubungi Teman Pilah di WhatsApp"
        className="group relative flex h-13 w-13 md:h-14 md:w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(37,211,102,0.4)] transition-transform duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
      >
        <span className="sr-only">Hubungi via WhatsApp</span>
        {/* Tooltip on desktop hover */}
        <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full bg-[#154212] px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:block">
          Chat WhatsApp
        </span>

        {/* WhatsApp Icon */}
        <svg
          viewBox="0 0 24 24"
          width="28"
          height="28"
          fill="currentColor"
          className="transition-transform group-hover:rotate-6"
        >
          <path d="M12.031 2C6.495 2 2 6.495 2 12.031c0 1.97.57 3.81 1.558 5.373L2 22l4.743-1.523A9.97 9.97 0 0012.031 22C17.568 22 22 17.505 22 12.031 22 6.495 17.568 2 12.031 2zm0 18.286c-1.748 0-3.376-.51-4.757-1.39l-.341-.219-2.825.907.925-2.756-.24-.374a8.243 8.243 0 01-1.282-4.423c0-4.57 3.717-8.286 8.286-8.286 4.57 0 8.286 3.717 8.286 8.286 0 4.57-3.716 8.286-8.286 8.286zm4.542-6.198c-.249-.125-1.472-.726-1.7-.809-.228-.083-.394-.125-.56.125-.166.249-.643.809-.788.975-.145.166-.29.187-.54.062-.249-.125-1.052-.388-2.003-1.236-.74-.66-1.24-1.475-1.385-1.724-.145-.249-.015-.384.11-.508.112-.112.249-.29.373-.436.125-.145.166-.249.249-.415.083-.166.042-.311-.021-.436-.062-.125-.56-1.349-.768-1.847-.202-.486-.407-.42-.56-.428l-.477-.008c-.166 0-.436.062-.664.311-.228.249-.872.851-.872 2.075 0 1.224.892 2.407 1.017 2.573.125.166 1.756 2.682 4.254 3.761.594.257 1.059.41 1.421.525.597.19 1.14.163 1.57.099.479-.071 1.472-.602 1.68-1.183.207-.581.207-1.079.145-1.183-.062-.104-.228-.166-.477-.29z" />
        </svg>
      </a>
    </aside>
  );
}

export default FloatingWhatsApp;
