"use client";

import Image from "next/image";
import { useI18n } from "../i18n/LanguageProvider";

export default function Hero() {
  const { t } = useI18n();
  return (
    <section
      id="top"
      className="relative isolate min-h-[100svh] w-full overflow-hidden"
    >
      <Image
        src="/photos/portfolio/DSC_8639-2_kopie.jpg"
        alt=""
        priority
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/70" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col items-start justify-end px-6 pb-24 pt-40 md:px-10 md:pb-32">
        <span className="eyebrow !text-[#f5c98c] !text-sm fade-up drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
          {t.hero.eyebrow}
        </span>
        <h1 className="font-display mt-4 max-w-4xl text-5xl leading-[1.05] text-white md:text-7xl lg:text-[5.5rem] fade-up">
          {t.hero.title}
        </h1>
        <p className="mt-6 max-w-2xl text-base text-white/85 md:text-lg fade-up">
          {t.hero.subtitle}
        </p>
        <div className="mt-10 flex flex-wrap gap-3 fade-up">
          <a href="#contact" className="btn btn-hero-primary">
            {t.hero.ctaPrimary}
          </a>
          <a href="#portfolio" className="btn btn-hero-ghost">
            {t.hero.ctaSecondary}
          </a>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-white/70">
        scroll
      </div>
    </section>
  );
}
