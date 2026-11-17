// PERINGATAN ARSITEKTUR: Jangan ubah path ini setelah label dicetak; jika harus berubah, pasang redirect.
import { getSiteUrl } from './api-config';

/**
 * Normalisasi kode batch (menghapus spasi dan huruf besar semua)
 */
export function normalizeBatchCode(code: string): string {
  if (!code) return '';
  return code.trim().toUpperCase();
}

/**
 * Menghasilkan path URL untuk batch.
 * @param code Kode batch publik (misal EE-2610-A7K9X2)
 * @param short Jika true, gunakan alias pendek `/b/[code]` untuk kesederhanaan modul matrix QR
 */
export function buildBatchPath(code: string, short: boolean = false): string {
  const normalized = normalizeBatchCode(code);
  return short ? `/b/${normalized}` : `/eco-enzyme/batch/${normalized}`;
}

/**
 * Menghasilkan URL lengkap (absolute URL) untuk dicetak pada label QR atau dibagikan.
 * URL pendek `/b/[code]` menghasilkan modul matrix QR yang lebih renggang,
 * sehingga jauh lebih mudah dan tahan lama dipindai oleh kamera HP di galon fisik.
 */
export function buildBatchUrl(
  code: string,
  options?: { short?: boolean; baseUrl?: string }
): string {
  let siteUrl = options?.baseUrl;
  if (!siteUrl && typeof window !== 'undefined') {
    const saved = localStorage.getItem('tp_qr_base_url');
    if (saved && saved.trim()) {
      siteUrl = saved.trim();
    }
  }
  if (!siteUrl) {
    siteUrl = getSiteUrl();
  }
  siteUrl = siteUrl.replace(/\/+$/, '');
  const path = buildBatchPath(code, options?.short ?? true);
  return `${siteUrl}${path}`;
}

/**
 * Deteksi apakah URL merupakan URL sementara/lokal
 * (localhost, IP privat, atau tunnel ngrok/trycloudflare)
 */
export function isTemporaryBaseUrl(url?: string): boolean {
  const target = url || getSiteUrl();
  return (
    target.includes('localhost') ||
    target.includes('127.0.0.1') ||
    target.includes('192.168.') ||
    target.includes('10.') ||
    target.includes('172.16.') ||
    target.includes('172.31.') ||
    target.includes('trycloudflare.com') ||
    target.includes('ngrok')
  );
}
