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

// Selection feedback follows the Webflow / Framer / Figma pattern:
// solid 2px outline in primary purple (matches WebZítra brand), no
// glow, no pulse animation. Glow effects bleed into adjacent elements
// and motion is distracting in editors. Tags ("Heading", "Image")
// appear above the selected element so klient sees what kind of
// element they're editing without checking the side panel.
const HIGHLIGHT_CSS = `
[data-wz-field] {
  cursor: pointer;
  transition: outline-color 0.15s ease, outline-offset 0.15s ease,
              background-color 0.15s ease;
  outline: 2px solid transparent;
  outline-offset: 2px;
  border-radius: 1px;
}
[data-wz-field]:hover {
  outline-color: rgba(124, 58, 237, 0.45);
  background-color: rgba(124, 58, 237, 0.03);
}
[data-wz-edit-active="true"] {
  outline-color: #7c3aed !important;
  outline-offset: 3px !important;
  background-color: rgba(124, 58, 237, 0.04) !important;
}
[data-wz-edit-active="true"]::before {
  content: attr(data-wz-element-type);
  position: absolute;
  top: -22px;
  left: -2px;
  z-index: 9999;
  padding: 2px 8px;
  border-radius: 4px 4px 0 0;
  background: #7c3aed;
  color: white;
  font-size: 10px;
  font-weight: 600;
  font-family: -apple-system, system-ui, sans-serif;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  pointer-events: none;
  white-space: nowrap;
  line-height: 1.4;
}
[data-wz-edit-active="true"] {
  position: relative;
}
[data-wz-edit-inline="true"] {
  outline-color: #7c3aed !important;
  outline-offset: 3px !important;
  background-color: rgba(124, 58, 237, 0.06) !important;
  cursor: text !important;
}
[data-wz-edit-inline="true"]:focus {
  outline-width: 2.5px !important;
  outline-offset: 4px !important;
}
[data-wz-section] {
  position: relative;
  transition: background-color 0.18s ease;
}
[data-wz-section-hover="true"] {
  background-color: rgba(124, 58, 237, 0.018);
}
[data-wz-section-hover="true"]::before {
  content: "Upravit sekci";
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 9999;
  padding: 6px 11px;
  border-radius: 6px;
  background: #7c3aed;
  color: white;
  font-size: 11px;
  font-weight: 600;
  font-family: -apple-system, system-ui, sans-serif;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  opacity: 0;
  transform: translateY(-3px);
  animation: wz-fade-in 0.14s ease-out forwards;
}
@keyframes wz-fade-in {
  to { opacity: 1; transform: translateY(0); }
}
[data-wz-section-active="true"] {
  outline: 2px solid rgba(124, 58, 237, 0.4);
  outline-offset: -2px;
  background-color: rgba(124, 58, 237, 0.02);
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
    let activeSectionEl: HTMLElement | null = null;
    let inlineEl: HTMLElement | null = null;
    let inlineOriginalText = "";

    function elementTypeLabel(el: HTMLElement): string {
      const tag = el.tagName;
      switch (tag) {
        case "H1":
          return "Nadpis 1";
        case "H2":
          return "Nadpis 2";
        case "H3":
          return "Nadpis 3";
        case "H4":
        case "H5":
        case "H6":
          return "Nadpis";
        case "P":
          return "Odstavec";
        case "SPAN":
          return "Text";
        case "A":
          return el.classList.contains("btn") ? "Tlačítko" : "Odkaz";
        case "BUTTON":
          return "Tlačítko";
        case "IMG":
          return "Obrázek";
        case "LI":
          return "Položka";
        default:
          return tag.toLowerCase();
      }
    }

    function setActive(el: HTMLElement | null) {
      if (activeEl) {
        activeEl.removeAttribute("data-wz-edit-active");
        activeEl.removeAttribute("data-wz-element-type");
      }
      activeEl = el;
      if (el) {
        el.setAttribute("data-wz-edit-active", "true");
        el.setAttribute("data-wz-element-type", elementTypeLabel(el));
      }
    }

    function setActiveSection(el: HTMLElement | null) {
      if (activeSectionEl) {
        activeSectionEl.removeAttribute("data-wz-section-active");
      }
      activeSectionEl = el;
      if (el) el.setAttribute("data-wz-section-active", "true");
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

      // 1. Field click — element selection. Element wins over section
      //    when click target is inside both.
      if (fieldEl) {
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
        setActiveSection(null);
        postToEditor({ type: "wz:focus-field", path });
        return;
      }

      // 2. Section click — section selection (background of the
      //    [data-wz-section] root, no inner field hit).
      const sectionEl = target?.closest(
        "[data-wz-section]",
      ) as HTMLElement | null;
      if (sectionEl) {
        const key = sectionEl.getAttribute("data-wz-section");
        if (!key) return;
        e.preventDefault();
        e.stopPropagation();
        setActive(null);
        setActiveSection(sectionEl);
        postToEditor({ type: "wz:focus-section", key });
        return;
      }

      // 3. Click outside any marker — clear selection.
      if (inlineEl) exitInline(true);
      setActive(null);
      setActiveSection(null);
      postToEditor({ type: "wz:focus-clear" });
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

    // Section hover: show "Upravit sekci" floating chip when the
    // cursor is over a section's background (not over a child
    // [data-wz-field]). Tracks the currently-hovered section so we
    // can clear the chip on mouseleave.
    let hoverSectionEl: HTMLElement | null = null;
    function setHoverSection(el: HTMLElement | null) {
      if (hoverSectionEl === el) return;
      if (hoverSectionEl) {
        hoverSectionEl.removeAttribute("data-wz-section-hover");
      }
      hoverSectionEl = el;
      if (el) el.setAttribute("data-wz-section-hover", "true");
    }
    function onMouseMove(e: MouseEvent) {
      const target = e.target as Element | null;
      // Field hover takes precedence — chip only over plain section bg.
      if (target?.closest("[data-wz-field]")) {
        setHoverSection(null);
        return;
      }
      const sectionEl = target?.closest(
        "[data-wz-section]",
      ) as HTMLElement | null;
      setHoverSection(sectionEl);
    }
    function onMouseLeave() {
      setHoverSection(null);
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
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("message", onMessage);

    // Tell the editor we're alive. The editor will reply with
    // wz:editor-ready and start sending content updates.
    postToEditor({ type: "wz:client-ready" });

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("dblclick", onDoubleClick, true);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("message", onMessage);
      const style = document.getElementById(HIGHLIGHT_STYLE_ID);
      if (style) style.remove();
      if (inlineEl) exitInline(false);
      setActive(null);
      setActiveSection(null);
      setHoverSection(null);
    };
  }, []);

  return null;
}
