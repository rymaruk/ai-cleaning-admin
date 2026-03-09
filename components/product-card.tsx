"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import type { ProductMatch } from "@/lib/product-types";
import { formatPrice } from "@/lib/utils/format";
import { getProductImageUrl } from "@/lib/utils/products";
import { useCart } from "@/context/cart-context";

const CARD_LINK_CLASS =
  "block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl";

type ProductCardProps = {
  product: ProductMatch;
  reason?: string | null;
  usageTip?: string | null;
  /** When set, card is clickable and opens detail modal instead of linking to product URL */
  onCardClick?: (product: ProductMatch) => void;
  /** When set, shows "Обрати" button to add product to selection (e.g. in search results) */
  onAddToCart?: (product: ProductMatch) => void;
  key?: string;
};

export function ProductCard({ product, reason, usageTip, onCardClick, onAddToCart }: ProductCardProps) {
  const [hover, setHover] = useState(false);
  const { isInCart } = useCart();
  const inCart = onAddToCart ? isInCart(product.id) : false;
  const imageUrl = getProductImageUrl(product);
  const priceStr = formatPrice(product.price);
  const hasHoverInfo = !onCardClick && ((reason?.trim() || usageTip?.trim()) ?? false);

  const card = (
    <Card
      className="overflow-hidden transition-shadow hover:shadow-md border-primary/20 relative"
      onMouseEnter={() => hasHoverInfo && setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...(onCardClick
        ? {
            role: "button",
            tabIndex: 0,
            onClick: () => onCardClick(product),
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onCardClick(product);
              }
            },
          }
        : {})}
    >
      <div className="relative aspect-square w-full bg-white">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Немає зображення
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-center gap-1">
          <Image
            src="/Karcher-Logo-700x394-1.webp"
            alt="Kärcher"
            width={56}
            height={24}
            className="h-5 w-auto object-contain opacity-90"
          />
        </div>
        <p className="text-[14px] font-medium leading-tight line-clamp-2">{product.name}</p>
        <p className="mt-1 text-sm font-medium text-green-600">{priceStr}</p>
        {(product.brand || product.category_name) && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {[product.brand, product.category_name].filter(Boolean).join(" · ")}
          </p>
        )}
        {onAddToCart && (
          <button
            type="button"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              e.stopPropagation();
              if (!inCart) onAddToCart(product);
            }}
            className={`mt-2 w-full rounded-lg py-1.5 text-xs font-medium ${
              inCart
                ? "bg-yellow-500 text-yellow-950 cursor-default"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {inCart ? "Обрано" : "Обрати"}
          </button>
        )}
      </CardContent>
      {hasHoverInfo && hover && (
        <div className="absolute inset-0 rounded-xl bg-background/95 backdrop-blur-sm p-4 flex flex-col justify-end border border-primary/20 shadow-lg pointer-events-none">
          <div className="mt-auto space-y-1.5 text-xs">
            {reason?.trim() && (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Чому: </span>
                {reason}
              </p>
            )}
            {usageTip?.trim() && (
              <p className="text-primary/90 italic">
                <span className="font-medium text-foreground not-italic">Порада: </span>
                {usageTip}
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );

  if (onCardClick) {
    return <div className={CARD_LINK_CLASS}>{card}</div>;
  }
  if (product.url) {
    return (
      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${CARD_LINK_CLASS} block`}
      >
        {card}
      </a>
    );
  }
  return card;
}
