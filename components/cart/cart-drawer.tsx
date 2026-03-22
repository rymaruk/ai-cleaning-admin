"use client";

import * as React from "react";
import Image from "next/image";
import { useCart } from "@/context/cart-context";
import { formatPrice } from "@/lib/utils/format";
import { getProductImageUrl } from "@/lib/utils/products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { ProductMatch } from "@/lib/product-types";
import type { CartItem } from "@/lib/cart-types";

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
  /** When true, modal is positioned absolute within parent (e.g. inside Card) instead of fixed viewport */
  scoped?: boolean;
  /** Current search query — shown in title as "Ваш вибір щоб {query}" */
  query?: string;
  /** When set, drawer shows only this product for fast purchase (no add to cart) */
  fastPurchaseProduct?: ProductMatch | null;
};

export function CartDrawer({ open, onClose, scoped = false, query, fastPurchaseProduct }: CartDrawerProps) {
  const { items: cartItems, total: cartTotalValue, removeItem, updateQuantity, clear } = useCart();
  const [fastQuantity, setFastQuantity] = React.useState(1);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitResult, setSubmitResult] = React.useState<"idle" | "success" | "error">("idle");
  const [customerName, setCustomerName] = React.useState("");
  const [customerPhone, setCustomerPhone] = React.useState("");

  const isFastPurchase = Boolean(fastPurchaseProduct);
  const items: CartItem[] = isFastPurchase && fastPurchaseProduct
    ? [{ product: fastPurchaseProduct, quantity: fastQuantity }]
    : cartItems;
  const total = isFastPurchase && fastPurchaseProduct
    ? (fastPurchaseProduct.price ?? 0) * fastQuantity
    : cartTotalValue;

  const handleUpdateQuantity = React.useCallback(
    (productId: string, quantity: number) => {
      if (isFastPurchase && fastPurchaseProduct && productId === fastPurchaseProduct.id) {
        setFastQuantity(Math.max(1, quantity));
      } else {
        updateQuantity(productId, quantity);
      }
    },
    [isFastPurchase, fastPurchaseProduct, updateQuantity]
  );

  React.useEffect(() => {
    if (fastPurchaseProduct) setFastQuantity(1);
  }, [fastPurchaseProduct?.id]);

  const handleSubmit = async () => {
    if (items.length === 0) return;
    const name = customerName.trim();
    const phone = customerPhone.trim();
    if (!name || !phone) return;
    setSubmitting(true);
    setSubmitResult("idle");
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer: {
            full_name: name,
            phone,
            email: "", // optional in KeyCRM
          },
          ...(query?.trim() && { buyer_comment: query.trim() }),
          products: items.map((i) => {
            const picture = i.product.images?.[0] && i.product.images[0].startsWith("http") ? i.product.images[0] : undefined;
            return {
              sku: i.product.id,
              name: i.product.name,
              price: i.product.price ?? 0,
              quantity: i.quantity,
              ...(picture && { picture }),
            };
          }),
          total,
        }),
      });
      await res.json().catch(() => ({}));
      if (res.ok) {
        setSubmitResult("success");
        if (!isFastPurchase) clear();
        setTimeout(() => {
          onClose();
          setSubmitResult("idle");
        }, 1500);
      } else {
        setSubmitResult("error");
      }
    } catch {
      setSubmitResult("error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const positionClass = scoped ? "absolute" : "fixed";

  return (
    <>
      <div
        className={`${positionClass} inset-0 z-40 bg-black/50`}
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`${positionClass} inset-0 z-50 flex items-center justify-center p-4`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        <div
          className="bg-background rounded-xl rounded-br-none shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e: { stopPropagation: () => void }) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4">
            <h2 id="cart-drawer-title" className="text-lg font-semibold">
              Швидке замовлення
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Закрити"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <Separator />
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Кошик порожній</p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => {
                  const imageUrl = getProductImageUrl(item.product);
                  const unitPrice = item.product.price ?? 0;
                  return (
                    <li key={item.product.id} className="group relative flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={item.product.name}
                            fill
                            className="object-contain"
                            sizes="56px"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
                            —
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2 space-y-0.5">
                            <Image
                              src="/Karcher-Logo-700x394-1.webp"
                              alt="Kärcher"
                              width={56}
                              height={24}
                              className="h-4 w-auto object-contain opacity-90"
                            />
                          </div>
                        <p className="text-sm font-medium line-clamp-1 mb-2">
                          {item.product.name}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm text-muted-foreground">К-сть:</span>
                            <Input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const v = parseInt(e.target.value, 10);
                                if (!Number.isNaN(v)) handleUpdateQuantity(item.product.id, Math.max(1, v));
                              }}
                              className="h-8 w-14 shrink-0 text-center text-sm"
                              aria-label={`Кількість ${item.product.name}`}
                            />
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            {formatPrice(item.quantity * (unitPrice ?? 0))}
                          </p>
                        </div>
                      </div>
                      {!isFastPurchase && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.product.id)}
                          className="absolute top-0 right-0 rounded p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Видалити ${item.product.name}`}
                        >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {items.length > 0 && (
            <>
              <Separator />
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="cart-customer-name" className="text-sm font-medium text-foreground">
                    Ім'я замовника
                  </label>
                  <Input
                    id="cart-customer-name"
                    type="text"
                    placeholder="Введіть ім'я"
                    value={customerName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerName(e.target.value)}
                    className="w-full"
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="cart-customer-phone" className="text-sm font-medium text-foreground">
                    Телефон
                  </label>
                  <Input
                    id="cart-customer-phone"
                    type="tel"
                    placeholder="+380 XX XXX XX XX"
                    value={customerPhone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomerPhone(e.target.value)}
                    className="w-full"
                    autoComplete="tel"
                  />
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Разом</span>
                  <span className="text-green-600">{formatPrice(total)}</span>
                </div>
                {submitResult === "success" && (
                  <p className="text-sm text-green-600">Замовлення відправлено в KeyCRM</p>
                )}
                {submitResult === "error" && (
                  <p className="text-sm text-destructive">Помилка відправки. Спробуйте ще раз.</p>
                )}
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={submitting || !customerName.trim() || !customerPhone.trim()}
                >
                  {submitting ? "Відправка…" : "Оформити замовлення"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
