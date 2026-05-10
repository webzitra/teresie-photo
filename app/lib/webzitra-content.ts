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
import type { BlockNode } from "../components/BlockRenderer";

const PROJECT_ID = process.env.WEBZITRA_PROJECT_ID;
const API =
  process.env.WEBZITRA_API ?? "https://app.webzitra.cz/api/public/content";

export interface WebzitraContent {
  content: Partial<Translation>;
  blocks?: BlockNode[];
  version: number;
}

/** Internal: hits the public content endpoint, returns the parsed
 *  payload or null on any error. Both getWebzitraContent and
 *  getWebzitraBlocks delegate here so a single render only triggers
 *  one network round-trip (Next.js fetch dedup keeps it that way).
 *
 *  When `editMode` is true (caller saw ?wz_edit=1 in the request URL,
 *  i.e. the page is rendering inside the WebZítra editor iframe), we
 *  bypass every cache layer: ?fresh=1 makes the upstream API respond
 *  with `cache-control: no-store`, and `cache: "no-store"` makes
 *  Next.js skip its data cache too. Klient sees their save reflected
 *  within ~200 ms of the DB write instead of waiting up to 60 s for
 *  ISR + CDN edge cache to expire. Public visitors (default branch)
 *  keep the 60 s tag-revalidate path — no SEO/perf regression. */
async function fetchWebzitra(
  editMode: boolean = false,
): Promise<WebzitraContent | null> {
  if (!PROJECT_ID) return null;
  try {
    const url = editMode
      ? `${API}/${PROJECT_ID}?fresh=1`
      : `${API}/${PROJECT_ID}`;
    const res = await fetch(
      url,
      editMode
        ? { cache: "no-store" }
        : {
            next: {
              tags: [`content:${PROJECT_ID}`],
              revalidate: 60,
            },
          },
    );
    if (!res.ok) {
      // 404 = no schema yet, 5xx = WebZítra issue. Either way, fall
      // through to the static fallback rather than break the page.
      return null;
    }
    return (await res.json()) as WebzitraContent;
  } catch {
    // Network error, abort, parse failure — fail closed to fallback.
    return null;
  }
}

export async function getWebzitraContent(
  editMode: boolean = false,
): Promise<Partial<Translation> | null> {
  const data = await fetchWebzitra(editMode);
  return data?.content ?? null;
}

/** Visual editor V2: returns the project's block tree from the
 *  headless CMS, or [] when not configured / fetch failed. Empty
 *  array signals "render legacy hardcoded layout" to page.tsx.
 *  `editMode` parameter mirrors getWebzitraContent — bypasses cache
 *  when set so saves reflect on iframe refresh in editor mode. */
export async function getWebzitraBlocks(
  editMode: boolean = false,
): Promise<BlockNode[]> {
  const data = await fetchWebzitra(editMode);
  return Array.isArray(data?.blocks) ? data.blocks : [];
}
