"use client";

// WebZítra edit overlay — client-side component that activates when the
// page is loaded inside the WebZítra editor iframe (signalled by
// `?wz_edit=1` on the URL). It does three things:
//
//   1. Hover/click handlers on every [data-wz-field] element. Click
//      posts `wz:focus-field` to the editor parent so the matching
//      form input gets focus + a highlight ring.
//   2. Origin-locked listener for messages from the editor. On
//      `wz:content-update` it walks the new content document and
//      patches the DOM (textContent for text fields, src for images)
//      so the editor can preview saves without waiting for ISR.
//   3. Sends `wz:client-ready` once mounted so the editor knows the
//      handshake completed and can hide its loading chip.
//
// The component renders nothing on the production site (no `wz_edit`
// param, no listeners attached). Loading the file as part of the
// bundle is acceptable — body is a couple of useEffects that early-
// return when not in edit mode.

import { useEffect } from "react";

const EDITOR_ORIGINS: ReadonlySet<string> = new Set([
  "https://app.webzitra.cz",
  // Add staging / dev origins here when needed.
  "http://localhost:3000",
  "http://localhost:3001",
]);

const HIGHLIGHT_STYLE_ID = "wz-edit-overlay-style";

const HIGHLIGHT_CSS = `
[data-wz-field] {
  cursor: pointer;
  transition: outline-color 0.12s ease, outline-offset 0.12s ease;
}
[data-wz-field]:hover {
  outline: 2px solid #a855f7;
  outline-offset: 3px;
}
[data-wz-edit-active="true"] {
  outline: 2px solid #7c3aed !important;
  outline-offset: 3px !important;
}
`;

function injectStyle() {
  if (typeof document === "undefined") return;
  if (document.getElementById(HIGHLIGHT_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = HIGHLIGHT_STYLE_ID;
  style.textContent = HIGHLIGHT_CSS;
  document.head.appendChild(style);
}

// Walk a path string ("services[0].title") through the content document.
function getAtPath(doc: unknown, pathStr: string): unknown {
  // Tokenize "a.b[0].c" → ["a", "b", 0, "c"].
  const tokens: Array<string | number> = [];
  const re = /([^.\[\]]+)|\[(\d+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(pathStr)) !== null) {
    if (match[1] !== undefined) tokens.push(match[1]);
    else if (match[2] !== undefined) tokens.push(parseInt(match[2], 10));
  }
  let cur: unknown = doc;
  for (const t of tokens) {
    if (cur == null) return undefined;
    if (typeof t === "number") {
      if (!Array.isArray(cur)) return undefined;
      cur = cur[t];
    } else if (typeof cur === "object" && !Array.isArray(cur)) {
      cur = (cur as Record<string, unknown>)[t];
    } else {
      return undefined;
    }
  }
  return cur;
}

function applyContent(content: unknown) {
  document.querySelectorAll<HTMLElement>("[data-wz-field]").forEach((el) => {
    const path = el.getAttribute("data-wz-field");
    if (!path) return;
    const value = getAtPath(content, path);
    if (value === undefined) return;
    if (el.tagName === "IMG" && typeof value === "string") {
      (el as HTMLImageElement).src = value;
      return;
    }
    if (typeof value === "string" || typeof value === "number") {
      el.textContent = String(value);
    }
  });
}

export function WebzitraEditOverlay() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("wz_edit") !== "1") return;
    if (window.parent === window) return; // not in an iframe

    injectStyle();

    let activeEl: HTMLElement | null = null;
    function setActive(el: HTMLElement | null) {
      if (activeEl) activeEl.removeAttribute("data-wz-edit-active");
      activeEl = el;
      if (el) el.setAttribute("data-wz-edit-active", "true");
    }

    function onClick(e: MouseEvent) {
      const target = e.target as Element | null;
      const fieldEl = target?.closest("[data-wz-field]") as HTMLElement | null;
      if (!fieldEl) return;
      const path = fieldEl.getAttribute("data-wz-field");
      if (!path) return;
      e.preventDefault();
      e.stopPropagation();
      setActive(fieldEl);
      // We don't know which editor origin to target, so post to all
      // allowed origins. The non-matching ones silently drop the
      // message because of the targetOrigin filter.
      EDITOR_ORIGINS.forEach((origin) => {
        window.parent.postMessage({ type: "wz:focus-field", path }, origin);
      });
    }

    function onMessage(e: MessageEvent) {
      if (!EDITOR_ORIGINS.has(e.origin)) return;
      const data = e.data as { type?: string; content?: unknown } | null;
      if (!data || typeof data.type !== "string") return;
      if (data.type === "wz:editor-ready") {
        // Editor confirmed the handshake; nothing to do.
      }
      if (data.type === "wz:content-update" && data.content !== undefined) {
        applyContent(data.content);
      }
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("message", onMessage);

    // Tell the editor we're alive. The editor will reply with
    // wz:editor-ready and start sending content updates.
    EDITOR_ORIGINS.forEach((origin) => {
      window.parent.postMessage({ type: "wz:client-ready" }, origin);
    });

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("message", onMessage);
      const style = document.getElementById(HIGHLIGHT_STYLE_ID);
      if (style) style.remove();
      setActive(null);
    };
  }, []);

  return null;
}
