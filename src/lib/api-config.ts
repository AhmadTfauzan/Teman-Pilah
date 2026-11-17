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
  if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.includes('trycloudflare.com')) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  }
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
}
