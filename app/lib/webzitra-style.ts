// Style overrides for content fields edited in WebZítra.
//
// Mirrors packages/app-core/src/lib/content/style.ts in the WebZítra
// monorepo (klient repo can't import from it directly). Editor writes
// content as either a primitive scalar (legacy) or as { value, style }
// once the user touches a style control. These helpers unwrap both
// shapes so JSX renders the value and applies overrides on top.

import type { CSSProperties } from "react";

export interface StyleOverrides {
  font?: {
    family?: string;
    size?: string;
    weight?: number;
    lineHeight?: string;
    letterSpacing?: string;
  };
  color?: {
    text?: string;
    background?: string;
  };
  spacing?: {
    marginTop?: string;
    marginBottom?: string;
    padding?: string;
  };
  align?: "left" | "center" | "right";
  hidden?: {
    mobile?: boolean;
    desktop?: boolean;
  };
}

export type StylableValue<T> = T | { value: T; style?: StyleOverrides };

function isWrapped<T>(
  v: StylableValue<T> | undefined | null,
): v is { value: T; style?: StyleOverrides } {
  return (
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    "value" in (v as object)
  );
}

export function getValue<T>(
  field: StylableValue<T> | undefined | null,
): T | undefined {
  if (field === undefined || field === null) return undefined;
  if (isWrapped(field)) return field.value;
  return field as T;
}

export function getStyle(field: unknown): CSSProperties {
  if (!isWrapped(field as StylableValue<unknown>)) return {};
  const wrapped = field as { value: unknown; style?: StyleOverrides };
  const s = wrapped.style;
  if (!s) return {};
  const out: CSSProperties = {};
  if (s.font?.family) out.fontFamily = s.font.family;
  if (s.font?.size) out.fontSize = s.font.size;
  if (s.font?.weight) out.fontWeight = s.font.weight;
  if (s.font?.lineHeight) out.lineHeight = s.font.lineHeight;
  if (s.font?.letterSpacing) out.letterSpacing = s.font.letterSpacing;
  if (s.color?.text) out.color = s.color.text;
  if (s.color?.background) out.backgroundColor = s.color.background;
  if (s.spacing?.marginTop) out.marginTop = s.spacing.marginTop;
  if (s.spacing?.marginBottom) out.marginBottom = s.spacing.marginBottom;
  if (s.spacing?.padding) out.padding = s.spacing.padding;
  if (s.align) out.textAlign = s.align;
  return out;
}

export function isHidden(
  field: unknown,
  breakpoint: "mobile" | "desktop",
): boolean {
  if (!isWrapped(field as StylableValue<unknown>)) return false;
  const wrapped = field as { value: unknown; style?: StyleOverrides };
  return wrapped.style?.hidden?.[breakpoint] === true;
}
