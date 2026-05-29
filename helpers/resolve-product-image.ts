import { existsSync } from "fs";
import path from "path";

const exts = [".png", ".jpg", ".jpeg", ".webp", ".avif"];

export function resolveProductImage(base?: string | null): string | null {
  if (!base) return null;
  for (const ext of exts) {
    const full = path.join(process.cwd(), "public", "Products", base + ext);
    if (existsSync(full)) return `/Products/${base}${ext}`;
  }
  return null;
}
