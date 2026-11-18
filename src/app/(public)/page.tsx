import React from 'react';

export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { Hero } from '@/components/landing/Hero';
import { About } from '@/components/landing/About';
import { Programs } from '@/components/landing/Programs';
import { VideoActivities } from '@/components/landing/VideoActivities';
import { Education } from '@/components/landing/Education';
import { ProductCatalog } from '@/components/landing/ProductCatalog';
import { Gallery } from '@/components/landing/Gallery';
import {
  BankSampahVideoItem,
  Education as EducationItem,
  Gallery as GalleryItem,
  HeroSlide,
  Product,
  VideoPlatform,
} from '@/types';

const envApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
const useEnvApiBase =
  Boolean(envApiUrl) &&
  !envApiUrl!.includes('trycloudflare.com') &&
  !envApiUrl!.includes('ngrok') &&
  !envApiUrl!.includes('localhost:2000');

function resolvePublicImageUrl(rawPath?: string | null): string | null {
  const path = rawPath?.trim();
  if (!path) return null;
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    (path.startsWith('/') && !path.startsWith('//'))
  ) {
    return path;
  }
  const cleanPath = path.replace(/^\/+/, '');
  return useEnvApiBase ? `${envApiUrl}/${cleanPath}` : `/${cleanPath}`;
}

function toWibDateStr(date: Date): string {
  const wib = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().split('T')[0];
}

interface LandingProgramCard {
  id: string;
  title: string;
  description: string;
  image: string;
  slug: string;
  category?: string;
  partnership?: string;
}

export default async function LandingPage() {
  // =========================
  // PRODUCTS
  // =========================
  let products: Product[] = [];

  try {
    const rawProducts = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    products = rawProducts.map((p) => ({
      id: p.id,
      productCode: p.productCode,
      name: p.name,
      category: p.category,
      description: p.description ?? '',
      image: resolvePublicImageUrl(p.image) ?? undefined,
      price: Number(p.price),
      priceUnit: p.priceUnit ?? '',
      stock: p.stock,
      stockLabel: p.stockLabel,
      whatsappLink: p.whatsappLink ?? '',
      qrCodeId: p.qrCodeId,
    }));
  } catch (error) {
    console.error('Failed to fetch products:', error);
    products = [];
  }

  // =========================
  // PROGRAMS / NEWS
  // =========================
  let programs: LandingProgramCard[] = [];

  try {
    const rawPrograms = await prisma.news.findMany({
      where: {
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const todayStr = toWibDateStr(new Date());

    programs = rawPrograms
      .filter((item) => {
        if (item.publishDate) {
          const startStr = toWibDateStr(item.publishDate);
          if (todayStr < startStr) return false;
        }
        if (item.endDate) {
          const endStr = toWibDateStr(item.endDate);
          if (todayStr > endStr) return false;
        }
        return true;
      })
      .map((item, idx) => {
        const resolvedImg =
          resolvePublicImageUrl(item.imageUrl) ?? `/activity/Pengmas (${(idx % 10) + 1}).jpeg`;

        return {
          id: item.id,
          title: item.title,
          description: item.summary || item.content,
          image: resolvedImg,
          slug: item.slug,
          category: item.category || undefined,
          partnership: item.partnership ?? undefined,
        };
      });
  } catch (error) {
    console.error('Failed to fetch programs:', error);
    programs = [];
  }

  // =========================
  // EDUCATION
  // =========================
  let education: EducationItem[] = [];

  try {
    const rawEducation = await prisma.educationContent.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    education = rawEducation.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      overview: item.overview,
      description: item.description,
      thumbnail: resolvePublicImageUrl(item.thumbnail) ?? undefined,
      tags: item.tags,
      publishDate: item.publishDate ? item.publishDate.toISOString() : undefined,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
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
    const rawGallery = await prisma.gallery.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    gallery = rawGallery.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      image: resolvePublicImageUrl(item.image) ?? item.image,
      description: item.description,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Failed to fetch gallery:', error);
    gallery = [];
  }

  // =========================
  // HERO SLIDES
  // =========================
  let heroSlides: HeroSlide[] = [];

  try {
    const rawSlides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    heroSlides = rawSlides.map((slide) => ({
      id: slide.id,
      imageUrl: resolvePublicImageUrl(slide.imageUrl) ?? slide.imageUrl,
      altText: slide.altText,
      caption: slide.caption,
      linkUrl: slide.linkUrl,
      linkLabel: slide.linkLabel,
      sortOrder: slide.sortOrder,
      isActive: slide.isActive,
      createdAt: slide.createdAt.toISOString(),
      updatedAt: slide.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error('Failed to fetch hero slides:', error);
    heroSlides = [];
  }

  // =========================
  // BANK SAMPAH VIDEOS
  // =========================
  let videos: BankSampahVideoItem[] = [];

  try {
    const rawVideos = await prisma.bankSampahVideo.findMany({
      orderBy: { sortOrder: 'asc' },
      take: 20,
    });

    videos = rawVideos.map((video) => ({
      id: video.id,
      title: video.title,
      videoUrl: video.videoUrl,
      platform: video.platform as VideoPlatform,
      thumbnail: resolvePublicImageUrl(video.thumbnail),
      duration: video.duration,
      description: video.description,
      category: video.category,
      aspect: video.aspect,
      sortOrder: video.sortOrder,
      createdAt: video.createdAt.toISOString(),
      updatedAt: video.updatedAt.toISOString(),
    }));
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
