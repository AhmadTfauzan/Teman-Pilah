'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { getBaseUrl } from '@/lib/api-config';
import { toast } from 'sonner';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isAuthenticated = localStorage.getItem('isAdminAuthenticated') === 'true';

    if (!token || !isAuthenticated) {
      localStorage.removeItem('token');
      localStorage.removeItem('isAdminAuthenticated');
      localStorage.removeItem('adminEmail');
      router.push('/login');
      return;
    }

    // Verifikasi validitas token ke backend
    const BASE_URL = getBaseUrl();
    fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          // Token expired atau invalid
          localStorage.removeItem('token');
          localStorage.removeItem('isAdminAuthenticated');
          localStorage.removeItem('adminEmail');
          toast.error('Sesi login telah berakhir. Silakan login kembali.');
          router.push('/login?expired=true');
        } else {
          setIsReady(true);
        }
      })
      .catch(() => {
        // Jika server backend offline saat verifikasi, tetap izinkan jika ada token
        setIsReady(true);
      });
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
