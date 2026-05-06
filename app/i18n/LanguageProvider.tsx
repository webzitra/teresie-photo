"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { type Lang, type Translation, translations } from "./translations";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translation;
};

const LanguageContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "teresie-lang";

// Recursively merge override values onto a base object. Plain objects
// are walked; arrays and scalars are replaced atomically (override
// wins). Used to overlay WebZítra-edited content (which may be partial)
// on top of the static fallback in translations.ts so the page survives
// missing fields and partial schema rollouts.
//
// Style-aware merge (Framer model — see docs/client-editor-redesign):
// when override is a wrapped { value, style } envelope and the inner
// value is empty/missing, but the base scalar exists, we preserve the
// base text and apply the override style on top. This decouples
// content overrides from style overrides — clearing text never blanks
// the rendered page, it falls back to the default with whatever style
// the klient chose. Without this, klient who deletes text on a styled
// field permanently hides that text on the live site (which is
// catastrophic UX, exactly the bug Lukáš hit).
function deepMergeCs(
  base: Translation,
  override: Partial<Translation> | null | undefined,
): Translation {
  if (!override) return base;
  return mergeRecord(
    base as unknown as Record<string, unknown>,
    override as Record<string, unknown>,
  ) as Translation;
}

function isStylableEnvelope(
  v: unknown,
): v is { value?: unknown; style?: unknown } {
  return (
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    ("value" in v || "style" in v)
  );
}

function mergeRecord(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (v === null || v === undefined) continue;
    const baseVal = base[k];

    // Style-aware fallback. If override is `{ style: {...} }` (no
    // value or empty value) and base is a scalar string/number, keep
    // the base text and just stamp the override's style on top.
    if (
      isStylableEnvelope(v) &&
      (v.value === undefined ||
        v.value === null ||
        v.value === "") &&
      (typeof baseVal === "string" || typeof baseVal === "number")
    ) {
      out[k] = { ...v, value: baseVal };
      continue;
    }

    if (
      typeof v === "object" &&
      !Array.isArray(v) &&
      typeof baseVal === "object" &&
      !Array.isArray(baseVal) &&
      baseVal !== null
    ) {
      out[k] = mergeRecord(
        baseVal as Record<string, unknown>,
        v as Record<string, unknown>,
      );
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function LanguageProvider({
  children,
  overrideCs,
}: {
  children: React.ReactNode;
  /** Partial Czech content from WebZítra. Overlaid on translations.cs.
   *  English stays static — multi-locale CMS is V2. */
  overrideCs?: Partial<Translation> | null;
}) {
  const [lang, setLangState] = useState<Lang>("cs");

  useEffect(() => {
    const stored = (typeof window !== "undefined" &&
      window.localStorage.getItem(STORAGE_KEY)) as Lang | null;
    if (stored === "cs" || stored === "en") {
      setLangState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l;
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      lang,
      setLang,
      t:
        lang === "cs"
          ? deepMergeCs(translations.cs, overrideCs)
          : translations.en,
    }),
    [lang, setLang, overrideCs],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useI18n must be used inside LanguageProvider");
  return ctx;
}
