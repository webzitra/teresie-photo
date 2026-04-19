"use client";

import Image from "next/image";
import { useI18n } from "../i18n/LanguageProvider";

export default function Services() {
  const { t } = useI18n();
  const s = t.services;

  return (
    <section
      id="services"
      className="relative bg-[var(--surface)] py-24 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="max-w-2xl">
          <span className="eyebrow">{s.eyebrow}</span>
          <h2 className="font-display mt-3 text-4xl leading-tight md:text-5xl lg:text-6xl">
            {s.title}
          </h2>
          <p className="mt-5 text-[var(--muted)] text-lg">{s.lead}</p>
        </div>

        <h3 className="font-display mt-16 text-2xl text-[var(--accent-dark)] md:text-3xl">
          {s.weddingTitle}
        </h3>

        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {s.packages.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-sm border p-7 transition hover:-translate-y-1 hover:shadow-[0_12px_40px_-20px_rgba(0,0,0,0.3)] ${
                p.highlight
                  ? "border-[var(--accent)] bg-[var(--background)] shadow-[0_8px_30px_-20px_rgba(0,0,0,0.3)]"
                  : "border-[var(--border)] bg-[var(--background)]/60"
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[var(--accent)] px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-white">
                  ★ doporučujeme / popular
                </span>
              )}
              <div className="mx-auto mb-5 relative h-40 w-40 overflow-hidden rounded-full ring-1 ring-[var(--border)]">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
              <div className="text-center font-display text-3xl">{p.name}</div>
              <div className="mt-4 flex items-baseline justify-center gap-1">
                <span className="font-display text-5xl">{p.price}</span>
                <span className="text-sm text-[var(--muted)]">
                  {s.currency}
                </span>
              </div>
              <ul className="mt-6 space-y-2.5 text-sm text-[var(--foreground)]/80">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 rounded-full bg-[var(--accent)] flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className={`btn mt-7 ${
                  p.highlight ? "btn-primary" : "btn-ghost"
                }`}
              >
                {s.bookCta}
              </a>
            </div>
          ))}
        </div>

        <h3 className="font-display mt-20 text-2xl text-[var(--accent-dark)] md:text-3xl">
          {s.otherTitle}
        </h3>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {s.others.map((o) => (
            <div
              key={o.name}
              className="group flex flex-col overflow-hidden rounded-sm border border-[var(--border)] bg-[var(--background)]/60 transition hover:-translate-y-1 hover:shadow-[0_12px_40px_-20px_rgba(0,0,0,0.3)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={o.image}
                  alt={o.name}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              </div>
              <div className="flex flex-1 flex-col p-7">
                <div className="font-display text-2xl">{o.name}</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display text-4xl">{o.price}</span>
                  <span className="text-sm text-[var(--muted)]">
                    {s.currency}
                  </span>
                </div>
                <p className="mt-5 text-sm text-[var(--foreground)]/75 leading-relaxed">
                  {o.desc}
                </p>
                <a href="#contact" className="btn btn-ghost mt-6 self-start">
                  {s.bookCta}
                </a>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm italic text-[var(--muted)]">{s.note}</p>
      </div>
    </section>
  );
}
