"use client";

import Image from "next/image";
import { useI18n } from "../i18n/LanguageProvider";

export default function About() {
  const { t } = useI18n();
  return (
    <section id="about" className="relative py-24 md:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-12 md:gap-16 md:px-10">
        <div className="md:col-span-5">
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm">
            <Image
              src="/photos/portfolio/_DSC9816_kopie.jpg"
              alt=""
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {t.about.stats.map((s) => (
              <div key={s.label}>
                <div className="font-display text-3xl text-[var(--foreground)] md:text-4xl">
                  {s.value}
                </div>
                <div className="mt-1 text-xs uppercase tracking-wider text-[var(--muted)]">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-7 md:pt-8">
          <span className="eyebrow">{t.about.eyebrow}</span>
          <h2 className="font-display mt-3 text-4xl leading-tight md:text-5xl lg:text-6xl">
            {t.about.title}
          </h2>
          <p className="font-display italic mt-6 text-xl text-[var(--accent-dark)] md:text-2xl">
            {t.about.lead}
          </p>
          <div className="mt-6 space-y-5 text-[var(--foreground)]/80 leading-relaxed">
            {t.about.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div className="mt-8 h-px w-24 bg-[var(--accent)]" />
          <p className="font-display italic mt-6 text-2xl">
            — Terezie Flašková
          </p>
        </div>
      </div>
    </section>
  );
}
