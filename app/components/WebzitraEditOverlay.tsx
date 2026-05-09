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
//      so saves preview without waiting for ISR. The same message
//      can carry a `blocks` array — we walk [data-wz-block-field]
//      and patch from the block tree analogously.
//   4. Sends wz:client-ready once mounted so the editor hides its
//      loading chip.
//   5. Block tree analog (Visual Editor V2+): elements rendered by
//      BlockRenderer carry data-wz-block-field="<blockId>.<fieldName>"
//      instead of legacy data-wz-field. Same single-click /
//      double-click affordances; events are wz:focus-block-field and
//      wz:inline-block-text-update.
//   6. Iframe-side "+" insert bars (Elementor pattern): hover-revealed
//      buttons between [data-wz-section] elements and at the start /
//      end of the page. Click posts wz:request-block-picker {
//      afterBlockId } and the editor opens its BlockPickerDialog.
//      MutationObserver re-injects bars when sections come and go
//      (e.g. after ISR refresh post-insert).
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
[data-wz-field],
[data-wz-block-field] {
  cursor: pointer;
  transition: outline-color 0.15s ease, outline-offset 0.15s ease,
              background-color 0.15s ease;
  outline: 2px solid transparent;
  outline-offset: 2px;
  border-radius: 1px;
}
[data-wz-field]:hover,
[data-wz-block-field]:hover {
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
[data-wz-edit-multiline="true"] {
  white-space: pre-wrap !important;
}
[data-wz-edit-multiline="true"]::after {
  content: "Enter = nový řádek · Cmd+Enter pro uložit · Esc pro zrušit";
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 9999;
  padding: 5px 9px;
  border-radius: 6px;
  background: #1f1227;
  color: #f3e8ff;
  font-size: 11px;
  font-weight: 500;
  font-family: -apple-system, system-ui, sans-serif;
  letter-spacing: 0.01em;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  pointer-events: none;
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

/* ── Iframe-side insert bars (Elementor pattern) ──────────────────
   Thin invisible strip between sections that grows on hover into a
   purple gradient pill. Klient klikne → editor opens BlockPickerDialog. */
[data-wz-insert-bar] {
  position: relative;
  height: 0;
  margin: 0;
  z-index: 9998;
  pointer-events: auto;
}
[data-wz-insert-bar]::before {
  content: "";
  position: absolute;
  left: 16px;
  right: 16px;
  top: 50%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.5), transparent);
  opacity: 0;
  transition: opacity 0.16s ease;
  pointer-events: none;
}
[data-wz-insert-bar]:hover {
  height: 56px;
}
[data-wz-insert-bar]:hover::before,
[data-wz-insert-bar]:focus-within::before {
  opacity: 1;
}
[data-wz-insert-bar] > button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.85);
  opacity: 0;
  pointer-events: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #7c3aed, #c026d3);
  color: white;
  border: none;
  border-radius: 9999px;
  padding: 6px 14px;
  font: 600 11.5px -apple-system, system-ui, sans-serif;
  letter-spacing: 0.02em;
  white-space: nowrap;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.2),
    0 0 0 3px rgba(124, 58, 237, 0.25);
  cursor: pointer;
  transition: transform 0.16s ease, opacity 0.16s ease, box-shadow 0.16s ease;
}
[data-wz-insert-bar]:hover > button,
[data-wz-insert-bar]:focus-within > button {
  opacity: 1;
  pointer-events: auto;
  transform: translate(-50%, -50%) scale(1);
}
[data-wz-insert-bar] > button:hover {
  transform: translate(-50%, -50%) scale(1.06);
  box-shadow:
    0 4px 14px rgba(0, 0, 0, 0.25),
    0 0 0 4px rgba(124, 58, 237, 0.4);
}
[data-wz-insert-bar] > button:focus-visible {
  outline: 2px solid white;
  outline-offset: 3px;
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

// ─── block-tree helpers (V2+) ─────────────────────────────────────
// Mirror of BlockRenderer's BlockNode shape — keep loose since we
// receive it over postMessage and don't want to import the editor's
// types into the klient bundle.
interface OverlayBlockNode {
  id: string;
  type: string;
  variant?: string;
  props?: Record<string, unknown>;
  children?: OverlayBlockNode[];
}

/** Parse `data-wz-block-field="<blockId>.<fieldName>"` into its parts.
 *  blockIds are crypto.randomUUID() — no dots — so the FIRST dot is
 *  the separator. Returns null when the attribute is malformed so
 *  callers fall through to other handlers (or no-op). */
function parseBlockFieldAttr(
  attr: string | null,
): { blockId: string; field: string } | null {
  if (!attr) return null;
  const dotIdx = attr.indexOf(".");
  if (dotIdx <= 0 || dotIdx === attr.length - 1) return null;
  return {
    blockId: attr.slice(0, dotIdx),
    field: attr.slice(dotIdx + 1),
  };
}

function findBlockById(
  blocks: ReadonlyArray<OverlayBlockNode>,
  id: string,
): OverlayBlockNode | null {
  for (const b of blocks) {
    if (b.id === id) return b;
    if (b.children && b.children.length > 0) {
      const nested = findBlockById(b.children, id);
      if (nested) return nested;
    }
  }
  return null;
}

/** Walk the block tree and patch every [data-wz-block-field] in the
 *  DOM. Mirrors applyContent but reads block.props[fieldName] instead
 *  of getAtPath(content, path). Same envelope unwrap, same APPLIED_STYLE_KEYS
 *  bookkeeping so styles reset cleanly when an override is dropped. */
function applyBlocks(blocks: ReadonlyArray<OverlayBlockNode>) {
  document
    .querySelectorAll<HTMLElement>("[data-wz-block-field]")
    .forEach((el) => {
      if (el.getAttribute("data-wz-edit-inline") === "true") return;
      const parsed = parseBlockFieldAttr(el.getAttribute("data-wz-block-field"));
      if (!parsed) return;
      const block = findBlockById(blocks, parsed.blockId);
      if (!block) return;
      const field = block.props ? block.props[parsed.field] : undefined;

      if (field !== undefined) {
        const value = getValue(field);
        if (el.tagName === "IMG" && typeof value === "string") {
          (el as HTMLImageElement).src = value;
        } else if (typeof value === "string" || typeof value === "number") {
          el.textContent = String(value);
        }
      }

      const styles =
        field !== undefined
          ? (getStyle(field) as Record<string, string | number>)
          : ({} as Record<string, string | number>);
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

function applyContent(content: unknown) {
  document.querySelectorAll<HTMLElement>("[data-wz-field]").forEach((el) => {
    // Don't clobber the element the user is currently editing inline
    // — that would yank what they're typing out from under them.
    if (el.getAttribute("data-wz-edit-inline") === "true") return;
    const path = el.getAttribute("data-wz-field");
    if (!path) return;
    const field = getAtPath(content, path);

    // Update text/src only when the override carries a value. If the
    // override was just stripped (klient pressed "Vrátit na výchozí"),
    // we don't know the bundled default text from this side — the
    // editor force-reloads the iframe in that case so a fresh server
    // render restores the bundled text. Here we just stop overriding.
    if (field !== undefined) {
      const value = getValue(field);
      if (el.tagName === "IMG" && typeof value === "string") {
        (el as HTMLImageElement).src = value;
      } else if (typeof value === "string" || typeof value === "number") {
        el.textContent = String(value);
      }
    }

    // Always reconcile inline style: when field is undefined or has
    // no style overrides, we clear every key we previously applied.
    // This guarantees a reset visually drops all our managed inline
    // styles even before the iframe reload completes.
    const styles =
      field !== undefined
        ? (getStyle(field) as Record<string, string | number>)
        : ({} as Record<string, string | number>);
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

// Tags whose inline edit we treat as multi-line: Enter inserts a new
// line (browser default <br>) and only Cmd/Ctrl+Enter commits. Single-
// line tags (headings, buttons, links) keep the original behavior —
// Enter commits, since wrapping a heading is rarely intended.
const MULTILINE_INLINE_TAGS = new Set(["P", "BLOCKQUOTE"]);

function isInlineEditable(el: HTMLElement): boolean {
  return INLINE_EDITABLE_TAGS.has(el.tagName);
}

function isMultilineInline(el: HTMLElement): boolean {
  if (el.dataset.wzMultiline === "true") return true;
  if (el.dataset.wzMultiline === "false") return false;
  return MULTILINE_INLINE_TAGS.has(el.tagName);
}

// Read the inline text out of a contentEditable host. For multi-line
// hosts we must not use textContent — Chrome inserts <br> for Shift+
// Enter and wraps later lines in <div>, both of which textContent
// silently strips, so the user's newlines round-trip to "". Walk the
// DOM and emit \n at line breaks instead.
function extractInlineText(el: HTMLElement, multiline: boolean): string {
  if (!multiline) return el.textContent ?? "";
  const parts: string[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      parts.push(node.nodeValue ?? "");
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const child = node as HTMLElement;
    const tag = child.tagName;
    if (tag === "BR") {
      parts.push("\n");
      return;
    }
    // Block-ish wrappers Chrome inserts after Enter — emit a leading
    // newline before the block's text content (skip the very first
    // node so we don't get a stray \n at the start).
    const isBlock = tag === "DIV" || tag === "P";
    if (isBlock && parts.length > 0 && !parts[parts.length - 1]?.endsWith("\n")) {
      parts.push("\n");
    }
    child.childNodes.forEach(walk);
  };
  el.childNodes.forEach(walk);
  // Collapse runs of >2 newlines (typical when Chrome wraps each new
  // line in its own <div>) and trim trailing whitespace.
  return parts.join("").replace(/\n{3,}/g, "\n\n").replace(/\s+$/, "");
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
      const blockFieldAttr = el.getAttribute("data-wz-block-field");
      const path = el.getAttribute("data-wz-field") || "";
      const newText = extractInlineText(el, isMultilineInline(el));
      el.removeAttribute("data-wz-edit-inline");
      el.removeAttribute("data-wz-edit-multiline");
      el.removeAttribute("contenteditable");
      el.removeAttribute("spellcheck");
      // Detach the input listeners that the inline session installed.
      el.removeEventListener("blur", onInlineBlur);
      el.removeEventListener("keydown", onInlineKeydown);
      inlineEl = null;
      if (commit && newText !== inlineOriginalText) {
        const parsed = parseBlockFieldAttr(blockFieldAttr);
        if (parsed) {
          postToEditor({
            type: "wz:inline-block-text-update",
            blockId: parsed.blockId,
            field: parsed.field,
            value: newText,
          });
        } else if (path) {
          postToEditor({ type: "wz:inline-text-update", path, value: newText });
        }
      } else if (!commit) {
        // Restore original text on cancel. For multi-line hosts the
        // original was stored with \n separators; rebuild the DOM with
        // <br> between lines so the visual revert matches.
        if (isMultilineInline(el)) {
          el.innerHTML = "";
          const lines = inlineOriginalText.split("\n");
          lines.forEach((line, i) => {
            if (i > 0) el.appendChild(document.createElement("br"));
            if (line) el.appendChild(document.createTextNode(line));
          });
        } else {
          el.textContent = inlineOriginalText;
        }
      }
    }

    function onInlineBlur() {
      exitInline(true);
    }

    function onInlineKeydown(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (e.key === "Enter") {
        // Multi-line hosts: Enter inserts a newline (let the browser do
        // it), Cmd/Ctrl+Enter or blur commits. Single-line hosts keep
        // the heading/button behavior — Enter commits, Shift+Enter
        // would technically still insert <br> but is unusual.
        const multiline = isMultilineInline(el);
        const wantsCommit = multiline ? e.metaKey || e.ctrlKey : !e.shiftKey;
        if (wantsCommit) {
          e.preventDefault();
          el.blur();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        exitInline(false);
      }
    }

    function startInline(el: HTMLElement) {
      // If another element was already in inline edit, commit it.
      if (inlineEl && inlineEl !== el) exitInline(true);
      inlineEl = el;
      const multiline = isMultilineInline(el);
      inlineOriginalText = extractInlineText(el, multiline);
      el.setAttribute("contenteditable", "true");
      el.setAttribute("spellcheck", "true");
      el.setAttribute("data-wz-edit-inline", "true");
      if (multiline) el.setAttribute("data-wz-edit-multiline", "true");
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

      // 1a. Block-tree field click (Visual Editor V2+). Block fields
      //     are nested inside legacy data-wz-section (block-rendered
      //     hero still has data-wz-section="hero" on its root) so we
      //     check block-field FIRST — otherwise the section fallback
      //     swallows the click.
      const blockFieldEl = target?.closest(
        "[data-wz-block-field]",
      ) as HTMLElement | null;
      if (blockFieldEl) {
        if (inlineEl && blockFieldEl !== inlineEl) {
          exitInline(true);
          return;
        }
        if (inlineEl === blockFieldEl) return;
        const parsed = parseBlockFieldAttr(
          blockFieldEl.getAttribute("data-wz-block-field"),
        );
        if (!parsed) return;
        e.preventDefault();
        e.stopPropagation();
        setActive(blockFieldEl);
        setActiveSection(null);
        postToEditor({
          type: "wz:focus-block-field",
          blockId: parsed.blockId,
          field: parsed.field,
        });
        return;
      }

      // 1b. Legacy schema field click — element selection. Element
      //     wins over section when click target is inside both.
      const fieldEl = target?.closest("[data-wz-field]") as HTMLElement | null;
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
      // Block-field takes precedence (same reasoning as onClick).
      const blockFieldEl = target?.closest(
        "[data-wz-block-field]",
      ) as HTMLElement | null;
      if (blockFieldEl && isInlineEditable(blockFieldEl)) {
        e.preventDefault();
        e.stopPropagation();
        setActive(blockFieldEl);
        startInline(blockFieldEl);
        return;
      }
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
      const data = e.data as {
        type?: string;
        content?: unknown;
        blocks?: unknown;
      } | null;
      if (!data || typeof data.type !== "string") return;
      if (data.type === "wz:editor-ready") {
        // Editor confirmed the handshake; nothing to do.
      }
      if (data.type === "wz:content-update") {
        if (data.content !== undefined) applyContent(data.content);
        if (Array.isArray(data.blocks)) {
          applyBlocks(data.blocks as ReadonlyArray<OverlayBlockNode>);
        }
      }
    }

    // ─── Iframe insert bars ───────────────────────────────────────
    // Inject "+" insertion bars before / between / after every
    // [data-wz-section] root. Each bar carries the blockId of the
    // section ABOVE it (or empty string = "insert at start"); click
    // posts wz:request-block-picker to the editor. MutationObserver
    // re-runs the inject pass whenever sections come or go (typical
    // after ISR refresh post-insert).
    const INSERT_BAR_ATTR = "data-wz-insert-bar";

    function makeInsertBar(afterBlockId: string): HTMLElement {
      const bar = document.createElement("div");
      bar.setAttribute(INSERT_BAR_ATTR, "");
      bar.dataset.wzInsertAfter = afterBlockId;
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute(
        "aria-label",
        afterBlockId ? "Přidat blok pod tuto sekci" : "Přidat blok na začátek",
      );
      button.innerHTML =
        '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg><span>Přidat blok</span>';
      button.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        postToEditor({
          type: "wz:request-block-picker",
          afterBlockId: afterBlockId || null,
        });
      });
      bar.appendChild(button);
      return bar;
    }

    function refreshInsertBars() {
      // Drop existing bars first so we don't pile up duplicates each
      // time a section moves or the page rerenders. Only ours are
      // tagged with INSERT_BAR_ATTR.
      document
        .querySelectorAll(`[${INSERT_BAR_ATTR}]`)
        .forEach((el) => el.remove());

      const sections = Array.from(
        document.querySelectorAll<HTMLElement>("[data-wz-section]"),
      );
      if (sections.length === 0) return;

      // Bar BEFORE the first section — insert at start (afterBlockId=null).
      const first = sections[0]!;
      first.parentElement?.insertBefore(makeInsertBar(""), first);

      // Bar AFTER every section. Last one becomes "insert at end".
      for (const section of sections) {
        const blockId = section.getAttribute("data-wz-block") ?? "";
        const bar = makeInsertBar(blockId);
        section.parentElement?.insertBefore(bar, section.nextSibling);
      }
    }

    // Debounce repeated mutations into one re-inject. Section additions
    // typically come in a burst (React commit + child renders).
    let refreshHandle: ReturnType<typeof setTimeout> | null = null;
    function scheduleRefresh() {
      if (refreshHandle !== null) return;
      refreshHandle = setTimeout(() => {
        refreshHandle = null;
        refreshInsertBars();
      }, 120);
    }

    refreshInsertBars();

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        // Cheap pre-check: only care about additions/removals of section
        // roots. Editing text inside a section emits attribute mutations
        // we should ignore.
        const touched = [
          ...Array.from(m.addedNodes),
          ...Array.from(m.removedNodes),
        ];
        const sectionTouch = touched.some((n) => {
          if (!(n instanceof HTMLElement)) return false;
          if (n.matches?.("[data-wz-section]")) return true;
          return !!n.querySelector?.("[data-wz-section]");
        });
        if (sectionTouch) {
          scheduleRefresh();
          return;
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

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
      observer.disconnect();
      if (refreshHandle !== null) clearTimeout(refreshHandle);
      document
        .querySelectorAll(`[${INSERT_BAR_ATTR}]`)
        .forEach((el) => el.remove());
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
