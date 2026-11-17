export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2000';
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
}

