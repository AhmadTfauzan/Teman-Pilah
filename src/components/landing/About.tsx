'use client';

import React from 'react';
import Image from 'next/image';
import { Container } from '@/components/layout/Container';
import { OutlineLeaf, ConcentricCircles } from '@/components/ui/DecorativeElements';

export function About() {
  const points = [
    {
      num: '01',
      title: 'Visi',
      desc: 'Menjadi pelopor gerakan masyarakat sadar lingkungan untuk Indonesia yang bersih, hijau, dan lestari berlandaskan kemandirian warga.',
    },
    {
      num: '02',
      title: 'Misi',
      desc: 'Mengedukasi masyarakat, memfasilitasi pemilahan sampah, dan berkolaborasi dengan berbagai pihak dalam pengelolaan limbah.',
    },
    {
      num: '03',
      title: 'Nilai',
      desc: 'Kepedulian, gotong royong, keberlanjutan, dan inovasi dalam setiap langkah pelestarian lingkungan.',
    },
  ];

  return (
    <section
      id="tentang"
      className="relative w-full overflow-hidden bg-[#012D1D] py-20 lg:py-28"
    >
      {/* ─── DECORATIVE BACKGROUND ACCENTS (Figma: OutlineLeaf & ConcentricCircles) ─── */}
      <div className="absolute -right-20 -bottom-24 opacity-35 pointer-events-none rotate-[15deg]">
        <OutlineLeaf size={460} color="#203220" strokeWidth={6.72} />
      </div>
      <div className="absolute -right-20 -top-20 opacity-30 pointer-events-none">
        <ConcentricCircles size={340} color="#0B4A31" strokeWidth={3.6} />
      </div>

      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* ─── LEFT: IMAGE WITH GLOW & ROTATED BADGE ─── */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[500px]">
              {/* Blur Aura (Figma: #09563A, filter: blur(28.8px)) */}
              <div
                aria-hidden="true"
                className="absolute inset-2 -bottom-4 rounded-[16px] bg-[#09563A] filter blur-[28px] opacity-80"
              />

              {/* Main Photo */}
              <div className="relative h-[380px] sm:h-[460px] md:h-[520px] w-full rounded-[12px] overflow-hidden border border-[#0B4A31] shadow-2xl">
                <Image
                  src="/pengmas 1.png"
                  alt="Tentang Teman Pilah"
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 500px"
                />
              </div>
            </div>
          </div>

          {/* ─── RIGHT: TEXT & 3 SECTIONS (01, 02, 03) ─── */}
          <div className="lg:col-span-7 flex flex-col">
            {/* Heading */}
            <h2 className="font-['Poppins'] font-bold text-3xl sm:text-4xl lg:text-[44px] leading-tight lg:leading-[55px] text-white tracking-[-1px]">
              Tentang Teman Pilah
            </h2>

            {/* Subtitle */}
            <p className="font-['Poppins'] font-normal text-base sm:text-lg text-[#C9D6CF] leading-relaxed sm:leading-[31px] mt-4 max-w-[600px]">
              Kami adalah komunitas pejuang lingkungan yang berkomitmen menciptakan
              ekosistem bersih dan bebas sampah melalui aksi kolektif.
            </p>

            {/* 3 Items (Visi, Misi, Nilai) */}
            <div className="mt-8 flex flex-col">
              {points.map((item) => (
                <div
                  key={item.num}
                  className="flex items-start gap-5 py-6 border-t border-[#0B4A31] transition-colors hover:border-[#FC9634]/40"
                >
                  {/* Number 01, 02, 03 */}
                  <span className="font-['Poppins'] font-bold text-2xl sm:text-[30px] leading-none text-[#FC9634] shrink-0 pt-0.5">
                    {item.num}
                  </span>

                  {/* Title & Desc */}
                  <div className="flex flex-col gap-1.5 flex-1">
                    <h3 className="font-['Poppins'] font-bold text-xl sm:text-[22px] leading-snug text-white">
                      {item.title}
                    </h3>
                    <p className="font-['Poppins'] font-normal text-sm sm:text-[16px] leading-relaxed text-[#C9D6CF]">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default About;
