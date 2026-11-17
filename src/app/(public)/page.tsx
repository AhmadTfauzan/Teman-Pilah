import { getBaseUrl } from '../../lib/api-config';
import React from 'react';

export const dynamic = 'force-dynamic';

import { Hero } from '@/components/landing/Hero';
import { About } from '@/components/landing/About';
import { Programs } from '@/components/landing/Programs';
import { VideoActivities } from '@/components/landing/VideoActivities';
import { Education } from '@/components/landing/Education';
import { ProductCatalog } from '@/components/landing/ProductCatalog';
import { Gallery } from '@/components/landing/Gallery';
import { galleryApi } from '@/lib/api/gallery';
import { videoApi } from '@/lib/api/video';
import { Gallery as GalleryItem, BankSampahVideoItem } from '@/types';

const BASE_URL = getBaseUrl();

type ProgramItem = {
  id: string | number;
  title: string;
  summary?: string;
  content: string;
  image?: string;
  imageUrl?: string;
  slug: string;
  status?: string;
  publishDate?: string;
  endDate?: string;
  partnership?: string;
};

export default async function LandingPage() {

  // =========================
  // PRODUCTS
  // =========================
  let products = [];

  try {
    const productsRes = await fetch(
      `${BASE_URL}/api/products`,
      {
        cache: 'no-store',
      }
    );

    const productsJson = await productsRes.json();

    products = (productsJson?.data || []).map((p: any) => ({
      ...p,
      image: p.image
        ? p.image.startsWith('http')
          ? p.image
          : `${BASE_URL}/${p.image}`
        : null,
    }));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    products = [];
  }

  // =========================
  // PROGRAMS / NEWS
  // =========================
  let programs = [];

  try {
    const programsRes = await fetch(
      `${BASE_URL}/api/news`,
      {
        cache: 'no-store',
      }
    );

    const programsJson = await programsRes.json();
    const now = new Date();
    const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const todayStr = wibTime.toISOString().split('T')[0]; // "2026-05-28"

    programs = (programsJson?.data || [])
      .filter((item: ProgramItem) => {
        // Only show PUBLISHED programs
        if (item.status && item.status !== 'PUBLISHED') return false;
        
        // Check Start Date
        if (item.publishDate) {
          const startStr = item.publishDate.split('T')[0];
          if (todayStr < startStr) return false;
        }
        
        // Check End Date
        if (item.endDate) {
          const endStr = item.endDate.split('T')[0];
          if (todayStr > endStr) return false;
        }
        
        return true;
      })
      .map((item: ProgramItem, idx: number) => {
        const rawImg = item.imageUrl || item.image;
        const resolvedImg = rawImg
          ? rawImg.startsWith('http') || rawImg.startsWith('/')
            ? rawImg
            : `${BASE_URL}/${rawImg}`
          : `/activity/Pengmas (${(idx % 10) + 1}).jpeg`;

        return {
          id: item.id,
          title: item.title,
          description: item.summary || item.content,
          image: resolvedImg,
          slug: item.slug,
          partnership: item.partnership,
        };
      });
  } catch (error) {
    console.error(
      'Failed to fetch programs:',
      error
    );

    programs = [];
  }

  // =========================
  // EDUCATION
  // =========================
  let education = [];

  try {
    const educationRes = await fetch(
      `${BASE_URL}/api/education`,
      {
        cache: 'no-store',
      }
    );

    const educationJson = await educationRes.json();
    education = (educationJson?.data || [])
      .filter((item: any) => item.status === 'PUBLISHED')
      .map((item: any) => ({
        ...item,
        thumbnail: item.thumbnail
          ? item.thumbnail.startsWith('http') || item.thumbnail.startsWith('/')
            ? item.thumbnail
            : `${BASE_URL}/${item.thumbnail}`
          : null,
      }));
  } catch (error) {
    console.error('Failed to fetch education:', error);
    education = [];
  }

  // =========================
  // GALLERY
  // =========================
  let gallery: GalleryItem[] = [];

  try {
    gallery = await galleryApi.getAll();
  } catch (error) {
    console.error('Failed to fetch gallery:', error);
    gallery = [];
  }

  // =========================
  // HERO SLIDES
  // =========================
  let heroSlides = [];

  try {
    const heroRes = await fetch(`${BASE_URL}/api/hero`, {
      cache: 'no-store',
    });
    const heroJson = await heroRes.json();
    heroSlides = heroJson?.data || [];
  } catch (error) {
    console.error('Failed to fetch hero slides:', error);
    heroSlides = [];
  }

  // =========================
  // BANK SAMPAH VIDEOS
  // =========================
  let videos: BankSampahVideoItem[] = [];

  try {
    videos = await videoApi.getAll({ limit: 20 });
  } catch (error) {
    console.error('Failed to fetch videos:', error);
    videos = [];
  }

  return (
    <div className="overflow-x-hidden pt-0">

      <Hero initialSlides={heroSlides} />

      <About />

      <Programs programs={programs} />

      <VideoActivities initialVideos={videos} />

      <Education items={education} />

      <ProductCatalog products={products} />

      <Gallery items={gallery} />

    </div>
  );
}