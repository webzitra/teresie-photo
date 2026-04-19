"use client";

import Image from "next/image";
import { useI18n } from "../i18n/LanguageProvider";

const photos = [
  "/photos/portfolio/DSC_8639-2_kopie.jpg",
  "/photos/portfolio/DSC_4761_kopie.jpg",
  "/photos/portfolio/_DSC0776_kopie.jpg",
  "/photos/portfolio/DSC_2688.jpg",
  "/photos/portfolio/_DSC1288-222_kopie.jpg",
  "/photos/portfolio/DSC_4032_kopie.jpg",
  "/photos/portfolio/DSC_5591_kopie.jpg",
  "/photos/portfolio/_DSC2655_kopie.jpg",
  "/photos/portfolio/DSC_3166-4_kopie.jpg",
  "/photos/portfolio/DSC_6025-2.jpg",
  "/photos/portfolio/DSC_4897_kopie.jpg",
  "/photos/portfolio/_DSC9816_kopie.jpg",
  "/photos/portfolio/DSC_1793.jpg",
  "/photos/portfolio/DSC_6485.jpg",
  "/photos/portfolio/DSC_1906.jpg",
  "/photos/portfolio/_DSC8507-2.jpg",
  "/photos/portfolio/DSC_2473.jpg",
  "/photos/portfolio/DSC_2956-2.jpg",
  "/photos/portfolio/DSC_2437.jpg",
  "/photos/portfolio/_DSC2893-2.jpg",
  "/photos/portfolio/DSC_7649.jpg",
  "/photos/portfolio/DSC_3949.jpg",
  "/photos/portfolio/_DSC5815-2.jpg",
  "/photos/portfolio/DSC_8680.jpg",
  "/photos/portfolio/DSC_6846.jpg",
  "/photos/portfolio/DSC_7742-2.jpg",
  "/photos/portfolio/_DSC0843.jpg",
];

export default function Portfolio() {
  const { t } = useI18n();

  return (
    <section id="portfolio" className="py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="max-w-2xl">
          <span className="eyebrow">{t.portfolio.eyebrow}</span>
          <h2 className="font-display mt-3 text-4xl leading-tight md:text-5xl lg:text-6xl">
            {t.portfolio.title}
          </h2>
          <p className="mt-5 text-[var(--muted)] text-lg">
            {t.portfolio.lead}
          </p>
        </div>

        <div className="mt-12 columns-2 gap-3 md:columns-3 md:gap-5 lg:columns-4 [column-fill:_balance]">
          {photos.map((src, i) => (
            <figure
              key={src}
              className="group mb-3 md:mb-5 break-inside-avoid relative overflow-hidden rounded-sm bg-[var(--surface)]"
            >
              <Image
                src={src}
                alt=""
                width={800}
                height={1000}
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.03]"
                priority={i < 4}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
