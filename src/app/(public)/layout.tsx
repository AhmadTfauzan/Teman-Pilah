'use client';

import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { BottomNav } from '@/components/landing/BottomNav';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <Navbar />
      {/* pb-14 memberi ruang agar konten tidak tertutup BottomNav di mobile */}
      <main className="flex-grow pb-14 md:pb-0">
        {children}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
