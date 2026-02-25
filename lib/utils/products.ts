import type { ProductMatch } from "@/lib/product-types";

export function getProductImageUrl(product: ProductMatch): string | null {
  const first = product.images?.[0];
  return first && first.startsWith("http") ? first : null;
}
