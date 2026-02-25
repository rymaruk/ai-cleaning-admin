import type { ProductMatch } from "@/lib/product-types";

export type CartItem = {
  product: ProductMatch;
  quantity: number;
};

export function cartItemSubtotal(item: CartItem): number {
  const price = item.product.price ?? 0;
  return price * item.quantity;
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + cartItemSubtotal(item), 0);
}
