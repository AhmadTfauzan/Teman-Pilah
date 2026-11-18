/**
 * Parse hostname dari URL (atau host[:port]) secara aman menggunakan URL API.
 * Mengembalikan null untuk relative path atau string yang tidak valid.
 */
export function parseUrlHostname(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('/')) {
    return null;
  }

  const withScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)
    ? trimmed
    : `http://${trimmed}`;

  try {
    return new URL(withScheme).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Cek apakah hostname merupakan host lokal loopback atau domain tunnel sementara.
 */
export function isLocalOrTunnelHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    host === '::1' ||
    host === 'trycloudflare.com' ||
    host.endsWith('.trycloudflare.com') ||
    /(?:^|\.)ngrok(?:-free)?(?:\.|$)/i.test(host)
  );
}

export function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (
    envUrl &&
    envUrl.trim() !== '' &&
    !envUrl.includes('trycloudflare.com') &&
    !envUrl.includes('ngrok') &&
    !envUrl.includes('localhost:2000')
  ) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  // Di browser selalu gunakan relative path ke Next.js internal API
  if (typeof window !== 'undefined') {
    return '';
  }
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

export function getSiteUrl(): string {
  const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envSiteUrl) {
    const hostname = parseUrlHostname(envSiteUrl);
    if (hostname && !isLocalOrTunnelHostname(hostname)) {
      return envSiteUrl.replace(/\/+$/, '');
    }
  }
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
}
