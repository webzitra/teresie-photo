"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useI18n } from "../i18n/LanguageProvider";

export default function Nav() {
  const { t, lang, setLang } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#about", label: t.nav.about },
    { href: "#services", label: t.nav.services },
    { href: "#portfolio", label: t.nav.portfolio },
    { href: "#contact", label: t.nav.contact },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[var(--background)]/85 backdrop-blur-md border-b border-[var(--border)]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
        <a
          href="#top"
          aria-label="Teresie Photo"
          className="relative block h-12 w-12 md:h-14 md:w-14"
        >
          <Image
            src="/brand/logo.png"
            alt="Teresie Photo"
            fill
            priority
            sizes="56px"
            className={`object-contain transition-[filter] duration-300 ${
              scrolled || open
                ? ""
                : "brightness-0 invert drop-shadow-[0_1px_6px_rgba(0,0,0,0.45)]"
            }`}
          />
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`text-sm transition ${
                scrolled
                  ? "text-[var(--foreground)]/80 hover:text-[var(--accent-dark)]"
                  : "text-white/90 hover:text-[var(--accent)]"
              }`}
            >
              {l.label}
            </a>
          ))}
          <LangSwitch lang={lang} setLang={setLang} dark={!scrolled} />
          <a
            href="#contact"
            className={`btn !py-2 !px-5 transition-colors ${
              scrolled ? "btn-primary" : "btn-hero-primary"
            }`}
          >
            {t.nav.booking}
          </a>
        </nav>

        <button
          aria-label="Menu"
          className="md:hidden p-2 -mr-2"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <div className="space-y-1.5">
            <span
              className={`block h-px w-6 transition-transform ${
                scrolled || open ? "bg-[var(--foreground)]" : "bg-white"
              } ${open ? "translate-y-2 rotate-45" : ""}`}
            />
            <span
              className={`block h-px w-6 transition-opacity ${
                scrolled || open ? "bg-[var(--foreground)]" : "bg-white"
              } ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`block h-px w-6 transition-transform ${
                scrolled || open ? "bg-[var(--foreground)]" : "bg-white"
              } ${open ? "-translate-y-2 -rotate-45" : ""}`}
            />
          </div>
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--background)]">
          <nav className="flex flex-col px-6 py-6 gap-5">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-base text-[var(--foreground)]"
              >
                {l.label}
              </a>
            ))}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
              <LangSwitch lang={lang} setLang={setLang} />
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="btn btn-primary !py-2 !px-5"
              >
                {t.nav.booking}
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function LangSwitch({
  lang,
  setLang,
  dark = false,
}: {
  lang: "cs" | "en";
  setLang: (l: "cs" | "en") => void;
  dark?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label="Language"
      className={`inline-flex rounded-full border p-0.5 text-xs transition-colors ${
        dark ? "border-white/40" : "border-[var(--border)]"
      }`}
    >
      {(["cs", "en"] as const).map((l) => {
        const active = lang === l;
        return (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-3 py-1 rounded-full font-medium uppercase tracking-wider transition ${
              active
                ? dark
                  ? "bg-white text-[var(--foreground)]"
                  : "bg-[var(--foreground)] text-[var(--background)]"
                : dark
                  ? "text-white/80 hover:text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
            aria-pressed={active}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
