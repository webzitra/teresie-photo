"use client";

import Image from "next/image";
import { useI18n } from "../i18n/LanguageProvider";

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="bg-[var(--background)] border-t border-[var(--border)] py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-[var(--muted)] md:flex-row md:px-10">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/logo.png"
            alt="Teresie Photo"
            width={44}
            height={44}
            className="h-11 w-11 object-contain"
          />
          <span className="hidden md:inline">{t.footer.tagline}</span>
        </div>
        <div className="flex flex-col items-center gap-1 md:flex-row md:gap-3">
          <span>
            © {new Date().getFullYear()} Terezie Flašková. {t.footer.rights}.
          </span>
          <span className="hidden md:inline">·</span>
          <span>
            {t.footer.madeBy}{" "}
            <a
              href="https://webzitra.cz"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-[var(--foreground)]"
            >
              WebZítra
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
