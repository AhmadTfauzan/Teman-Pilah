'use client';

import React from 'react';
import { Container } from '@/components/layout/Container';
import { OutlineLeaf, ConcentricCircles } from '@/components/ui/DecorativeElements';
import { Product } from '@/types';
import { getBaseUrl } from '@/lib/api-config';

interface ProductCatalogProps {
  products?: Product[];
}

const BASE_URL = getBaseUrl();

const DEFAULT_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Pupuk POC',
    description:
      'Pupuk organik cair dari olahan sampah dapur untuk tanaman yang lebih subur.',
    price: 15000,
    image: '/activity/Pengmas (11).jpeg',
    whatsappLink: 'https://wa.me/6281234567890?text=Halo%20saya%20tertarik%20dengan%20Pupuk%20POC',
  },
  {
    id: 'prod-2',
    name: 'Kombucha',
    description:
      'Minuman teh fermentasi menyegarkan buatan anggota komunitas Teman Pilah.',
    price: 19988,
    image: '/activity/Pengmas (12).jpeg',
    whatsappLink: 'https://wa.me/6281234567890?text=Halo%20saya%20tertarik%20dengan%20Kombucha',
  },
  {
    id: 'prod-3',
    name: 'Sabun Eco Enzym',
    description:
      'Sabun ramah lingkungan dengan bahan dasar eco enzyme yang lembut di kulit.',
    price: 20000,
    image: '/activity/Pengmas (13).jpeg',
    whatsappLink: 'https://wa.me/6281234567890?text=Halo%20saya%20tertarik%20dengan%20Sabun%20Eco%20Enzym',
  },
];

function resolveProductImage(path?: string | null, fallbackIndex: number = 0): string {
  if (!path) return DEFAULT_PRODUCTS[fallbackIndex % DEFAULT_PRODUCTS.length].image;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return path;
  return `${BASE_URL}/${path}`;
}

export function ProductCatalog({ products }: ProductCatalogProps) {
  const displayProducts =
    products && products.length > 0
      ? products.slice(0, 3).map((p, idx) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        image: resolveProductImage(p.image || p.imageUrl, idx),
        fallbackImage: DEFAULT_PRODUCTS[idx % DEFAULT_PRODUCTS.length].image,
        whatsappLink:
          p.whatsappLink ||
          `https://wa.me/6281234567890?text=Halo%20saya%20tertarik%20dengan%20produk%20${encodeURIComponent(
            p.name
          )}`,
      }))
      : DEFAULT_PRODUCTS.map((p) => ({ ...p, fallbackImage: p.image }));

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  return (
    <section
      id="katalog"
      className="relative w-full overflow-hidden bg-[#F1F4F9] py-10 sm:py-16 lg:py-28"
    >
      {/* ─── DECORATIVE ACCENTS (Figma Frame 48: OutlineLeaf & ConcentricCircles) ─── */}
      <div className="hidden sm:block absolute -right-24 -top-24 opacity-25 pointer-events-none rotate-[35deg]">
        <OutlineLeaf size={380} color="#203220" strokeWidth={6.72} />
      </div>
      <div className="hidden sm:block absolute -left-24 -bottom-24 opacity-20 pointer-events-none">
        <ConcentricCircles size={340} color="#012D1D" />
      </div>

      <Container className="relative z-10">
        {/* ─── SECTION HEADER ─── */}
        <div className="pb-6 sm:pb-12 max-w-[640px]">
          <h2 className="font-['Poppins'] font-bold text-2xl sm:text-4xl lg:text-[44px] leading-tight text-[#012D1D] tracking-[-0.5px] sm:tracking-[-1px]">
            Katalog Produk Daur Ulang
          </h2>
          <p className="font-['Poppins'] font-normal text-xs sm:text-lg text-[#3D3D3D] mt-1 sm:mt-2">
            Dukung komunitas dengan membeli produk hasil karya daur ulang anggota kami.
          </p>
        </div>

        {/* ─── 3 PRODUCTS GRID (Figma: 286px x 476px) ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6 lg:gap-8 justify-center">
          {displayProducts.map((prod, idx) => (
            <div
              key={prod.id || idx}
              className="flex flex-col justify-between rounded-[10px] bg-white p-2.5 sm:p-4 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 border border-black/5"
            >
              <div>
                {/* Product Image (Figma: 254px x 254px, rounded 8px) */}
                <div className="relative h-[115px] sm:h-[254px] w-full rounded-[8px] overflow-hidden bg-gray-100 shadow-inner flex items-center justify-center">
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src !== prod.fallbackImage) {
                        target.src = prod.fallbackImage;
                      }
                    }}
                  />
                </div>

                {/* Title */}
                <h3 className="font-['Poppins'] font-bold text-xs sm:text-lg leading-snug sm:leading-[28px] text-[#111111] mt-2 sm:mt-4 line-clamp-1">
                  {prod.name}
                </h3>

                {/* Description */}
                <p className="font-['Poppins'] font-normal text-[11px] sm:text-sm leading-snug sm:leading-[21px] text-[#3D3D3D] mt-1 line-clamp-2">
                  {prod.description}
                </p>

                {/* Price (Figma: 20px 700 #012D1D) */}
                <p className="font-['Poppins'] font-bold text-sm sm:text-xl text-[#012D1D] mt-1.5 sm:mt-3">
                  {formatRupiah(prod.price)}
                </p>
              </div>

              {/* CTA Button: Pesan via WhatsApp */}
              <div className="pt-2.5 sm:pt-4 mt-auto">
                <a
                  href={prod.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 sm:gap-2 w-full h-8 sm:h-[44px] rounded-[8px] bg-[#012D1D] hover:bg-[#0B4A31] text-white font-['Poppins'] font-semibold text-[11px] sm:text-base transition-colors shadow-md"
                >
                  <img
                    src="/wa.png"
                    alt="WhatsApp"
                    className="h-3.5 w-3.5 sm:h-4 sm:w-4 object-contain brightness-0 invert"
                  />
                  <span className="sm:hidden">Pesan WA</span>
                  <span className="hidden sm:inline">Pesan via WhatsApp</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

export default ProductCatalog;
