// Types for liquid-lens.js.

export interface LensOptions {
  variant?: "regular" | "clear";
  radius?: number;
  bezel?: number;
  depth?: number;
  frost?: number;
  chroma?: number;
  thickness?: number;
  specular?: number;
}

export interface Lens {
  w: number;
  h: number;
  /** The <filter> element, to put inside a hidden <svg>. */
  markup: string;
  /** The backdrop-filter value that applies it. */
  backdrop: string;
}

export const LENS: Record<
  "regular" | "clear",
  {
    bezel: number;
    maxBezel: number;
    thickness: number;
    chroma: number;
    frost: number;
    specular: number;
    push: number;
    maxPush: number;
  }
>;

export function buildLensMaps(
  w: number,
  h: number,
  r: number,
  bezel: number,
  opts: { push: number; thickness?: number; specular?: number },
): { displacement: string; specular: string } | null;

export function lensFilterMarkup(
  id: string,
  w: number,
  h: number,
  maps: { displacement: string; specular: string },
  opts: { push: number; chroma?: number; frost?: number },
): string;

export function supportsBackdropRefraction(): boolean;

export function lensFor(el: HTMLElement, id: string, opts?: LensOptions): Lens | null;

export function attachLiquidGlass(el: HTMLElement, opts?: LensOptions): () => void;
