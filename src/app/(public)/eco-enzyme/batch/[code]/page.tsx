import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBaseUrl } from '@/lib/api-config';
import { normalizeBatchCode } from '@/lib/batch-url';
import { EcoEnzymeBatch } from '@/types';
import { BatchDetailClient } from './BatchDetailClient';

const BASE_URL = getBaseUrl();

// Pastikan halaman selalu dinamis (tidak tersangkut stale-cache) saat QR discan
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ code: string }>;
}

async function fetchBatch(rawCode: string): Promise<EcoEnzymeBatch | null> {
  const code = normalizeBatchCode(rawCode);
  try {
    const res = await fetch(`${BASE_URL}/api/eco-enzyme/public/${encodeURIComponent(code)}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    return json.data || null;
  } catch (error) {
    console.error(`Failed to fetch public batch ${code}:`, error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const batch = await fetchBatch(code);

  if (!batch) {
    return {
      title: 'Batch Tidak Ditemukan | Teman Pilah Eco Enzyme',
      description: 'Detail batch Eco Enzyme tidak dapat ditemukan. Periksa kembali label QR pada galon.',
    };
  }

  const isArchived = Boolean(batch.archivedAt || batch.status === 'ARCHIVED');
  const prefix = isArchived ? '[Diarsipkan] ' : '';
  const title = `${prefix}Batch ${batch.publicCode} (${batch.containerName}) | Teman Pilah Eco Enzyme`;
  const description = `Pantau proses fermentasi Eco Enzyme untuk wadah ${batch.containerName}. Rasio 1:3:10 dengan komposisi: ${batch.organicWasteTypes}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function BatchDetailPage({ params }: PageProps) {
  const { code } = await params;
  const batch = await fetchBatch(code);

  if (!batch) {
    notFound();
  }

  return <BatchDetailClient batch={batch} />;
}
