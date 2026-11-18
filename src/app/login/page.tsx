'use client';

import { getBaseUrl } from '../../lib/api-config';
import { setStoredAuthSession } from '../../lib/api/auth-session';
import React, { useState, useId, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ChevronRight,
  X,
  ShieldAlert,
} from 'lucide-react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

import { toast } from 'sonner';

const BASE_URL = getBaseUrl();

export default function LoginPage() {

  const emailId = useId();

  const passwordId = useId();

  const rememberId = useId();

  const router = useRouter();

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [rememberMe, setRememberMe] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [showForgotModal, setShowForgotModal] =
    useState(false);

  const hasShownExpiredToastRef = useRef(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || hasShownExpiredToastRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('expired') === 'true') {
      hasShownExpiredToastRef.current = true;
      toast.error('Sesi login telah berakhir atau tidak valid. Silakan login kembali.');
      router.replace('/login');
    }
  }, [router]);

  // =========================
  // LOGIN
  // =========================
  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setIsLoading(true);

    try {

      const apiUrl = BASE_URL ? `${BASE_URL}/api/auth/login` : '/api/auth/login';
      const res = await fetch(
        apiUrl,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.message || 'Login gagal'
        );
      }

      const token: string | undefined = data?.data?.token;
      if (!token) {
        throw new Error(
          data?.message || 'Respons server tidak valid: token tidak ditemukan.'
        );
      }

      // =========================
      // SIMPAN SESSION (localStorage jika "Ingat saya", sessionStorage jika tidak)
      // =========================
      setStoredAuthSession(token, email, rememberMe);

      toast.success(
        'Login berhasil!'
      );

      router.push('/admin');

    } catch (error) {

      console.error(error);

      let errMsg = 'Terjadi kesalahan saat login.';
      if (error instanceof Error) {
        const lower = error.message.toLowerCase();
        if (
          lower.includes('failed to fetch') ||
          lower.includes('networkerror') ||
          lower.includes('network request failed') ||
          lower.includes('load failed')
        ) {
          errMsg = 'Gagal terhubung ke server. Periksa koneksi Anda.';
        } else {
          errMsg = error.message;
        }
      }

      toast.error(errMsg);

    } finally {

      setIsLoading(false);

    }
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#F9FAF5]">

      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0">

        <Image
          src="/login/login.png"
          alt="Teman Pilah Background"
          fill
          className="object-cover"
          priority
        />

        <div className="absolute inset-0 bg-gradient-to-b from-[#154212]/80 to-[#F9FAF5]/20 backdrop-blur-[2px]" />

      </div>

      {/* LOGIN CARD */}
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.8,
          ease: 'easeOut',
        }}
        className="relative z-10 w-full max-w-[500px] px-6 py-8"
      >

        <Card className="bg-[#F9FAF5]/95 backdrop-blur-md border-white/20 shadow-2xl rounded-[40px] p-10 md:p-12 space-y-8">

          {/* HEADER */}
          <div className="flex flex-col items-center text-center space-y-4">

            <Link
              href="/"
              className="flex items-center gap-2 group"
            >

              <img
                src="/logo.png"
                alt="Logo Teman Pilah"
                className="h-12 w-12 rounded-full object-cover transform transition-transform group-hover:scale-110"
              />

              <span className="text-2xl font-extrabold text-[#154212] tracking-tight">
                Teman Pilah
              </span>

            </Link>

            <div className="space-y-2">

              <h1 className="text-3xl font-bold text-[#154212]">
                Admin Login
              </h1>

              <p className="text-[#42493E] font-medium opacity-70">
                Masuk untuk mengelola Dashboard Teman Pilah
              </p>

            </div>

          </div>

          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >

            <div className="space-y-5">

              {/* EMAIL */}
              <div className="space-y-2">

                <label
                  htmlFor={emailId}
                  className="text-sm font-bold text-[#154212] ml-1"
                >
                  Email
                </label>

                <div className="relative">

                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#154212]/40">

                    <Mail
                      size={18}
                      strokeWidth={2.5}
                    />

                  </div>

                  <input
                    id={emailId}
                    type="email"
                    required
                    placeholder="Masukkan Email Admin"
                    className="w-full h-14 bg-white border border-[#C2C9BB]/30 rounded-2xl pl-12 pr-4 text-[#154212] font-medium outline-none transition-all focus:border-[#154212] focus:ring-4 focus:ring-[#154212]/5"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                  />

                </div>

              </div>

              {/* PASSWORD */}
              <div className="space-y-2">

                <div className="flex items-center justify-between ml-1">

                  <label
                    htmlFor={passwordId}
                    className="text-sm font-bold text-[#154212]"
                  >
                    Password
                  </label>

                </div>

                <div className="relative">

                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#154212]/40">

                    <Lock
                      size={18}
                      strokeWidth={2.5}
                    />

                  </div>

                  <input
                    id={passwordId}
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    required
                    placeholder="Masukkan Password"
                    className="w-full h-14 bg-white border border-[#C2C9BB]/30 rounded-2xl pl-12 pr-12 text-[#154212] font-medium outline-none transition-all focus:border-[#154212] focus:ring-4 focus:ring-[#154212]/5"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                  />

                  <button
                    type="button"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#154212]/40 hover:text-[#154212] transition-colors"
                  >

                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}

                  </button>

                </div>

              </div>

            </div>

            {/* REMEMBER */}
            <div className="flex items-center justify-between ml-1">

              <label
                htmlFor={rememberId}
                className="flex items-center cursor-pointer group"
              >

                <div className="relative">

                  <input
                    id={rememberId}
                    type="checkbox"
                    className="sr-only"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(
                        e.target.checked
                      )
                    }
                  />

                  <div
                    className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                      rememberMe
                        ? 'bg-[#154212] border-[#154212]'
                        : 'bg-white border-[#C2C9BB]'
                    }`}
                  >

                    {rememberMe && (
                      <div className="w-2 h-2 rounded-[1px] bg-white" />
                    )}

                  </div>

                </div>

                <span className="ml-3 text-sm font-medium text-[#42493E]">
                  Ingat saya
                </span>

              </label>

              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  toast.info('Reset password admin dilakukan melalui administrator atau server.');
                }}
                className="text-xs font-bold text-[#FC9430] hover:underline"
              >
                Lupa Password?
              </button>

            </div>

            {/* BUTTON */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-[#154212] hover:bg-[#0E2F0C] text-white rounded-2xl font-bold text-lg shadow-xl shadow-[#154212]/20 relative overflow-hidden group"
            >

              {isLoading ? (

                <div className="h-6 w-6 animate-spin rounded-full border-3 border-white/30 border-t-white" />

              ) : (

                <span className="flex items-center justify-center gap-2">

                  Masuk Sekarang

                  <ChevronRight
                    size={20}
                    className="transition-transform group-hover:translate-x-1"
                  />

                </span>

              )}

            </Button>

          </form>

          <p className="text-center text-[#42493E] text-sm font-medium opacity-60 italic">
            Hanya akses untuk Administrator Teman Pilah
          </p>

        </Card>

      </motion.div>

      {showForgotModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-password-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#C2C9BB]/40 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-[#FC9430] shrink-0">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h2 id="forgot-password-title" className="text-base font-bold text-[#154212]">
                    Lupa Password Admin?
                  </h2>
                  <p className="text-xs text-[#42493E]/70">
                    Pemulihan akses akun Administrator
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Tutup panduan lupa password"
                onClick={() => setShowForgotModal(false)}
                className="rounded-lg p-1.5 text-[#42493E]/60 hover:bg-gray-100 hover:text-[#154212]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl bg-[#F9FAF5] border border-[#C2C9BB]/30 p-4 text-xs sm:text-sm text-[#42493E] space-y-2 leading-relaxed">
              <p>
                Untuk keamanan sistem, reset password akun admin tidak tersedia secara otomatis melalui email.
              </p>
              <p>
                Silakan hubungi <strong>Administrator Utama / Tim Teknis Teman Pilah</strong> atau perbarui password langsung melalui server (skrip seed / database admin). Jika sudah login di perangkat lain, password juga dapat diubah melalui endpoint <code className="px-1.5 py-0.5 rounded bg-white border border-[#C2C9BB]/40 text-[11px]">/api/auth/change-password</code>.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="rounded-xl bg-[#154212] hover:bg-[#0E2F0C] px-5 py-2.5 text-sm font-bold text-white transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}