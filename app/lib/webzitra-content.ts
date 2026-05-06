// Server-side fetch of localized content from WebZítra.
//
// When WEBZITRA_PROJECT_ID is set, every server render hits
// https://app.webzitra.cz/api/public/content/<id> and overlays the
// returned document on top of the hard-coded `translations.cs`
// document. The fetch is tagged with `content:<id>` so the
// /api/revalidate route can invalidate it on demand.
//
// When the env var is missing or the fetch fails, the function
// returns null and the LanguageProvider keeps the static fallback.
// That way the site survives WebZítra outages and can still be
// developed locally without any backend dependency.
//
// Style envelope helpers (getValue/getStyle/isHidden) live in
// ./webzitra-style — split out so this file stays focused on the
// fetch + cache concern.

import type { Translation } from "../i18n/translations";

const PROJECT_ID = process.env.WEBZITRA_PROJECT_ID;
const API =
  process.env.WEBZITRA_API ?? "https://app.webzitra.cz/api/public/content";

export interface WebzitraContent {
  content: Partial<Translation>;
  version: number;
}

export async function getWebzitraContent(): Promise<Partial<Translation> | null> {
  if (!PROJECT_ID) return null;

  try {
    const res = await fetch(`${API}/${PROJECT_ID}`, {
      next: {
        tags: [`content:${PROJECT_ID}`],
        revalidate: 60,
      },
    });
    if (!res.ok) {
      // 404 = no schema yet, 5xx = WebZítra issue. Either way, fall
      // through to the static fallback rather than break the page.
      return null;
    }
    const json = (await res.json()) as WebzitraContent;
    return json.content ?? null;
  } catch {
    // Network error, abort, parse failure — fail closed to fallback.
    return null;
  }
}
