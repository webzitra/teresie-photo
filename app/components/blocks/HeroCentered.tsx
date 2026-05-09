"use client";

// Visual editor V2 pilot block — Hero, centered variant.
//
// Mirrors today's app/components/Hero.tsx but reads from block.props
// (the data-driven path) instead of useI18n() + t.hero.*. Shape of
// each prop matches the existing translations.ts `hero` object so
// migrating an existing teresie content document into a Hero block
// is a 1:1 copy of the values.
//
// Style overrides flow exactly like in the legacy component:
// `{value, style}` envelopes are unwrapped via getValue/getStyle.

import Image from "next/image";
import { getStyle, getValue } from "../../lib/webzitra-style";
import type { BlockProps } from "../BlockRenderer";

interface HeroProps {
  eyebrow?: unknown;
  title?: unknown;
  subtitle?: unknown;
  ctaPrimary?: unknown;
  ctaSecondary?: unknown;
  image?: unknown;
}

const FALLBACK_IMAGE = "/photos/portfolio/DSC_8639-2_kopie.jpg";

export function HeroCentered({ blockId, props }: BlockProps) {
  const p = props as HeroProps;
  const imageSrc =
    (typeof getValue(p.image) === "string" && (getValue(p.image) as string)) ||
    FALLBACK_IMAGE;
  return (
    <section
      id="top"
      data-wz-section="hero"
      data-wz-block={blockId}
      className="relative isolate min-h-[100svh] w-full overflow-hidden"
    >
      <Image
        src={imageSrc}
        alt=""
        priority
        fill
        sizes="100vw"
        className="object-cover"
        data-wz-block-field={`${blockId}.image`}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/70" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col items-start justify-end px-6 pb-24 pt-40 md:px-10 md:pb-32">
        <span
          className="eyebrow !text-[#f5c98c] !text-sm fade-up drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]"
          data-wz-block-field={`${blockId}.eyebrow`}
          style={getStyle(p.eyebrow)}
        >
          {(getValue(p.eyebrow) as string) ?? ""}
        </span>
        <h1
          className="font-display mt-4 max-w-4xl text-5xl leading-[1.05] text-white md:text-7xl lg:text-[5.5rem] fade-up"
          data-wz-block-field={`${blockId}.title`}
          style={getStyle(p.title)}
        >
          {(getValue(p.title) as string) ?? ""}
        </h1>
        <p
          className="mt-6 max-w-2xl whitespace-pre-line text-base text-white/85 md:text-lg fade-up"
          data-wz-block-field={`${blockId}.subtitle`}
          data-wz-multiline="true"
          style={getStyle(p.subtitle)}
        >
          {(getValue(p.subtitle) as string) ?? ""}
        </p>
        <div className="mt-10 flex flex-wrap gap-3 fade-up">
          <a
            href="#contact"
            className="btn btn-hero-primary"
            data-wz-block-field={`${blockId}.ctaPrimary`}
            style={getStyle(p.ctaPrimary)}
          >
            {(getValue(p.ctaPrimary) as string) ?? ""}
          </a>
          <a
            href="#portfolio"
            className="btn btn-hero-ghost"
            data-wz-block-field={`${blockId}.ctaSecondary`}
            style={getStyle(p.ctaSecondary)}
          >
            {(getValue(p.ctaSecondary) as string) ?? ""}
          </a>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-white/70">
        scroll
      </div>
    </section>
  );
}
