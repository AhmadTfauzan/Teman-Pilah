// PERINGATAN ARSITEKTUR: Jangan ubah path ini setelah label dicetak; jika harus berubah, pasang redirect.
import {
  getSiteUrl,
  isLocalOrTunnelHostname,
  parseUrlHostname,
} from './api-config';

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
  const encoded = encodeURIComponent(normalized);
  return short ? `/b/${encoded}` : `/eco-enzyme/batch/${encoded}`;
}

/**
 * Menghasilkan URL lengkap (absolute URL) untuk dicetak pada label QR atau dibagikan.
 * URL pendek `/b/[code]` menghasilkan modul matrix QR yang lebih renggang,
 * sehingga jauh lebih mudah dan tahan lama dipindai oleh kamera HP di galon fisik.
 */
export function buildBatchUrl(
  code: string,
  options?: {
    short?: boolean;
    baseUrl?: string;
    allowLocalStorageOverride?: boolean;
  }
): string {
  let siteUrl = options?.baseUrl?.trim();
  const allowLocalStorage = options?.allowLocalStorageOverride ?? true;
  if (!siteUrl && allowLocalStorage && typeof window !== 'undefined') {
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

function isPrivateOrLoopbackIpv4(hostname: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
  if (!match) return false;

  const octets = match.slice(1).map((part) => Number(part));
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }

  const [a, b] = octets;
  if (a === 127) return true; // Loopback 127.0.0.0/8
  if (a === 10) return true; // RFC 1918 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // RFC 1918 172.16.0.0/12
  if (a === 192 && b === 168) return true; // RFC 1918 192.168.0.0/16
  return false;
}

/**
 * Deteksi apakah URL merupakan URL sementara/lokal
 * (localhost, loopback, IP privat RFC 1918, atau tunnel ngrok/trycloudflare)
 */
export function isTemporaryBaseUrl(url?: string): boolean {
  const target = (url || getSiteUrl()).trim();
  if (!target) return false;

  const hostname = parseUrlHostname(target);
  if (!hostname) return false;

  return isLocalOrTunnelHostname(hostname) || isPrivateOrLoopbackIpv4(hostname);
}
