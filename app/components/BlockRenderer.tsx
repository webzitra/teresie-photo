"use client";

// BlockRenderer — visual editor V2 entrypoint on the klient side.
//
// Reads the project's `c.blocks` tree (from WebZítra headless CMS)
// and renders each block by looking up its type+variant in this
// repo's local REGISTRY. When the tree is empty we render nothing —
// page.tsx falls back to the legacy hardcoded layout.
//
// Each block component receives:
//   - blockId: stable id, used for `data-wz-block` attribute so the
//     editor can target the rendered DOM via postMessage
//   - props: the block.props object from the tree (text/image fields
//     in the same { value, style? } envelope shape as today's
//     content-document fields)
//
// Block components are colocated in `./blocks/` — V2 ships Hero only;
// V3 fills the rest as klients migrate.

import type { ReactNode } from "react";
import { HeroCentered } from "./blocks/HeroCentered";

export interface BlockNode {
  id: string;
  type: string;
  variant?: string;
  props: Record<string, unknown>;
  children?: BlockNode[];
}

export interface BlockProps {
  blockId: string;
  props: Record<string, unknown>;
  children?: BlockNode[];
}

// Registry: type → variant → component. Variant key "default" is the
// fallback when block.variant is undefined or unknown.
const REGISTRY: Record<
  string,
  Record<string, (p: BlockProps) => ReactNode>
> = {
  hero: {
    default: HeroCentered,
    centered: HeroCentered,
  },
};

export function BlockRenderer({ blocks }: { blocks: BlockNode[] }) {
  if (!blocks || blocks.length === 0) return null;
  return (
    <>
      {blocks.map((block) => {
        const variants = REGISTRY[block.type];
        if (!variants) {
          // Unknown block type — skip silently in production. Studio
          // sees the warning during dev (see DOM data-wz-block-skip).
          return (
            <div
              key={block.id}
              data-wz-block-skip={block.type}
              style={{ display: "none" }}
            />
          );
        }
        const Component =
          variants[block.variant ?? "default"] ?? variants.default;
        if (!Component) return null;
        return (
          <Component
            key={block.id}
            blockId={block.id}
            props={block.props}
            children={block.children}
          />
        );
      })}
    </>
  );
}
