"use client";

// WebZítra edit overlay — client-side component that activates when the
// page is loaded inside the WebZítra editor iframe (signalled by
// `?wz_edit=1` on the URL).
//
// Capabilities:
//   1. Single click on a [data-wz-field] element posts wz:focus-field
//      to the editor parent so the matching form input gains focus.
//   2. Double click on a text [data-wz-field] flips contentEditable
//      on, selects all, and lets the user edit inline. Blur or Enter
//      commits — we post wz:inline-text-update with the new value.
//      Escape cancels and reverts to the previous text.
//   3. Origin-locked listener for messages from the editor. On
//      wz:content-update it walks the new content document and
//      patches the DOM (textContent for text fields, src for images)
//      so saves preview without waiting for ISR.
//   4. Sends wz:client-ready once mounted so the editor hides its
//      loading chip.
//
// The component renders nothing on the production site (no `wz_edit`
// param, no listeners attached). Bundle cost is a couple of
// useEffects that early-return when not in edit mode.

import { useEffect } from "react";
import { getStyle, getValue } from "../lib/webzitra-style";

// Tracks which CSS properties we've previously applied per element so
// that a subsequent update with fewer overrides clears the dropped
// keys instead of leaving them stuck. Keyed by element identity (a
// WeakMap handles GC). Value is the set of camelCase property names
// last written.
const APPLIED_STYLE_KEYS = new WeakMap<HTMLElement, Set<string>>();

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
[data-wz-edit-inline="true"] {
  outline: 2px solid #7c3aed !important;
  outline-offset: 3px !important;
  cursor: text !important;
  background: rgba(124, 58, 237, 0.06);
}
[data-wz-edit-inline="true"]:focus {
  outline-offset: 4px !important;
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
    // Don't clobber the element the user is currently editing inline
    // — that would yank what they're typing out from under them.
    if (el.getAttribute("data-wz-edit-inline") === "true") return;
    const path = el.getAttribute("data-wz-field");
    if (!path) return;
    const field = getAtPath(content, path);
    if (field === undefined) return;
    const value = getValue(field);
    if (el.tagName === "IMG" && typeof value === "string") {
      (el as HTMLImageElement).src = value;
    } else if (typeof value === "string" || typeof value === "number") {
      el.textContent = String(value);
    }
    // Apply (or clear) inline style overrides. We only manage keys
    // we've previously written so we don't fight static styles set
    // by Tailwind classes — keys we set last time but not this time
    // get reset to "" rather than to a baseline value we'd guess.
    const styles = getStyle(field) as Record<string, string | number>;
    const newKeys = new Set(Object.keys(styles));
    const prevKeys = APPLIED_STYLE_KEYS.get(el);
    if (prevKeys) {
      for (const k of prevKeys) {
        if (!newKeys.has(k)) {
          (el.style as unknown as Record<string, string>)[k] = "";
        }
      }
    }
    for (const [k, v] of Object.entries(styles)) {
      (el.style as unknown as Record<string, string>)[k] = String(v);
    }
    if (newKeys.size === 0) {
      APPLIED_STYLE_KEYS.delete(el);
    } else {
      APPLIED_STYLE_KEYS.set(el, newKeys);
    }
  });
}

// Tags whose textContent we let the user edit inline. Images/links
// route through other affordances (image picker for IMG, link editor
// later). LI is in here because lists of strings render each item as
// a <p>/<span> child, but the parent element itself often carries
// the data-wz-field marker.
const INLINE_EDITABLE_TAGS = new Set([
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "P",
  "SPAN",
  "A",
  "LI",
  "BUTTON",
  "BLOCKQUOTE",
  "FIGCAPTION",
  "STRONG",
  "EM",
]);

function isInlineEditable(el: HTMLElement): boolean {
  return INLINE_EDITABLE_TAGS.has(el.tagName);
}

export function WebzitraEditOverlay() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("wz_edit") !== "1") return;
    if (window.parent === window) return; // not in an iframe

    injectStyle();

    let activeEl: HTMLElement | null = null;
    let inlineEl: HTMLElement | null = null;
    let inlineOriginalText = "";

    function setActive(el: HTMLElement | null) {
      if (activeEl) activeEl.removeAttribute("data-wz-edit-active");
      activeEl = el;
      if (el) el.setAttribute("data-wz-edit-active", "true");
    }

    function postToEditor(message: Record<string, unknown>) {
      EDITOR_ORIGINS.forEach((origin) => {
        window.parent.postMessage(message, origin);
      });
    }

    function exitInline(commit: boolean) {
      if (!inlineEl) return;
      const el = inlineEl;
      const path = el.getAttribute("data-wz-field") || "";
      const newText = el.textContent ?? "";
      el.removeAttribute("data-wz-edit-inline");
      el.removeAttribute("contenteditable");
      el.removeAttribute("spellcheck");
      // Detach the input listeners that the inline session installed.
      el.removeEventListener("blur", onInlineBlur);
      el.removeEventListener("keydown", onInlineKeydown);
      inlineEl = null;
      if (commit && path && newText !== inlineOriginalText) {
        postToEditor({ type: "wz:inline-text-update", path, value: newText });
      } else if (!commit) {
        // Restore original text on cancel.
        el.textContent = inlineOriginalText;
      }
    }

    function onInlineBlur() {
      exitInline(true);
    }

    function onInlineKeydown(e: KeyboardEvent) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        (e.target as HTMLElement).blur();
      } else if (e.key === "Escape") {
        e.preventDefault();
        exitInline(false);
      }
    }

    function startInline(el: HTMLElement) {
      // If another element was already in inline edit, commit it.
      if (inlineEl && inlineEl !== el) exitInline(true);
      inlineEl = el;
      inlineOriginalText = el.textContent ?? "";
      el.setAttribute("contenteditable", "true");
      el.setAttribute("spellcheck", "true");
      el.setAttribute("data-wz-edit-inline", "true");
      el.addEventListener("blur", onInlineBlur);
      el.addEventListener("keydown", onInlineKeydown);
      el.focus();
      // Select-all so the first keystroke replaces the placeholder.
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }

    function onClick(e: MouseEvent) {
      const target = e.target as Element | null;
      const fieldEl = target?.closest("[data-wz-field]") as HTMLElement | null;
      if (!fieldEl) return;
      // While inline-editing, let clicks inside the editing element
      // pass through (move the caret). Click outside ends the session.
      if (inlineEl && fieldEl !== inlineEl) {
        exitInline(true);
        return;
      }
      if (inlineEl === fieldEl) return;
      const path = fieldEl.getAttribute("data-wz-field");
      if (!path) return;
      e.preventDefault();
      e.stopPropagation();
      setActive(fieldEl);
      postToEditor({ type: "wz:focus-field", path });
    }

    function onDoubleClick(e: MouseEvent) {
      const target = e.target as Element | null;
      const fieldEl = target?.closest("[data-wz-field]") as HTMLElement | null;
      if (!fieldEl || !isInlineEditable(fieldEl)) return;
      e.preventDefault();
      e.stopPropagation();
      setActive(fieldEl);
      startInline(fieldEl);
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
    document.addEventListener("dblclick", onDoubleClick, true);
    window.addEventListener("message", onMessage);

    // Tell the editor we're alive. The editor will reply with
    // wz:editor-ready and start sending content updates.
    postToEditor({ type: "wz:client-ready" });

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("dblclick", onDoubleClick, true);
      window.removeEventListener("message", onMessage);
      const style = document.getElementById(HIGHLIGHT_STYLE_ID);
      if (style) style.remove();
      if (inlineEl) exitInline(false);
      setActive(null);
    };
  }, []);

  return null;
}
