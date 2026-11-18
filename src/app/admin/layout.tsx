'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { getBaseUrl } from '@/lib/api-config';
import {
  clearStoredAuthSession,
  getStoredAuthToken,
  isStoredAdminAuthenticated,
} from '@/lib/api/auth-session';
import { toast } from 'sonner';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const clearSession = () => {
      clearStoredAuthSession();
    };

    const token = getStoredAuthToken();
    const isAuthenticated = isStoredAdminAuthenticated();

    if (!token || !isAuthenticated) {
      clearSession();
      router.push('/login');
      return;
    }

    // Verifikasi validitas token dan role ADMIN ke backend (fail-closed)
    const BASE_URL = getBaseUrl();
    fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (res) => {
        const json = await res.json().catch(() => null);
        if (cancelled) return;

        if (!res.ok || json?.data?.role !== 'ADMIN') {
          clearSession();
          toast.error('Sesi login telah berakhir. Silakan login kembali.');
          router.push('/login?expired=true');
          return;
        }

        setIsReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        clearSession();
        toast.error('Gagal memverifikasi sesi admin. Periksa koneksi server Anda.');
        router.push('/login');
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [router]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAF5]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2D5A27] border-t-transparent" />
          <p className="text-sm font-semibold text-[#2D5A27]">Memverifikasi sesi admin...</p>
        </div>
      </div>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
}
