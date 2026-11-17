import { NextResponse } from 'next/server';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function GET() {
  const interfaces = os.networkInterfaces();
  const candidates: { name: string; address: string; isWifiOrEth: boolean }[] = [];

  for (const name of Object.keys(interfaces)) {
    const lower = name.toLowerCase();
    if (
      lower.includes('vmware') ||
      lower.includes('virtual') ||
      lower.includes('vethernet') ||
      lower.includes('loopback') ||
      lower.includes('virtualbox') ||
      lower.includes('host-only')
    ) {
      continue;
    }

    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        // Abaikan IP subnet VirtualBox standar 192.168.56.x jika ada
        if (iface.address.startsWith('192.168.56.')) continue;

        const isWifi = lower.includes('wi-fi') || lower.includes('wifi') || lower.includes('wlan');
        const isEth = lower.includes('ethernet');
        candidates.push({ name, address: iface.address, isWifiOrEth: isWifi || isEth });
      }
    }
  }

  // Prioritas utama: Wi-Fi (karena HP dan laptop umumnya terhubung lewat Wi-Fi)
  const wifiCandidate = candidates.find((c) => c.name.toLowerCase().includes('wi-fi') || c.name.toLowerCase().includes('wifi'));
  const primary = wifiCandidate || candidates[0];
  const detectedIp = primary ? primary.address : null;

  return NextResponse.json({
    ip: detectedIp,
    candidates,
    siteUrlEnv: process.env.NEXT_PUBLIC_SITE_URL || null,
  });
}
