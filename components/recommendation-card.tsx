"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProductMatch } from "@/lib/product-types";
import type { RecommendedItem } from "@/lib/utils/recommendations";
import { formatPrice } from "@/lib/utils/format";
import { getProductImageUrl } from "@/lib/utils/products";
import { useCart } from "@/context/cart-context";

const CARD_LINK_CLASS =
  "block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl";

type RecommendationCardProps = RecommendedItem & {
  /** When set, shows "Обрати" / "Обрано" button (e.g. for top recommended products) */
  onAddToCart?: (product: ProductMatch) => void;
};

export function RecommendationCard({
  product,
  reason,
  usageTip,
  onAddToCart,
}: RecommendationCardProps) {
  const { isInCart } = useCart();
  const inCart = onAddToCart ? isInCart(product.id) : false;
  const imageUrl = getProductImageUrl(product);
  const priceStr = formatPrice(product.price);

  const card = (
    <Card className="overflow-hidden transition-shadow hover:shadow-md border-primary/20">
      <div className="relative aspect-square w-full bg-white">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            Немає зображення
          </div>
        )}
        <Badge
          variant="recommended"
          className="absolute left-2 top-2"
          label="Рекомендовано"
        />
      </div>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-1">
          <Image
            src="/Karcher-Logo-700x394-1.webp"
            alt="Kärcher"
            width={56}
            height={24}
            className="h-5 w-auto object-contain opacity-90"
          />
        </div>
        <p className="text-base font-medium leading-tight line-clamp-2">{product.name}</p>
        <p className="text-sm font-medium text-green-600">{priceStr}</p>
        <p className="text-xs text-muted-foreground">{reason}</p>
        <p className="text-xs text-primary/90 italic">{usageTip}</p>
        {(product.brand || product.category_name) && (
          <p className="text-xs text-muted-foreground">
            {[product.brand, product.category_name].filter(Boolean).join(" · ")}
          </p>
        )}
        {onAddToCart && (
          <button
            type="button"
            onClick={(e) => {
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
    </Card>
  );

  if (product.url) {
    return (
      <a href={product.url} target="_blank" rel="noopener noreferrer" className={CARD_LINK_CLASS}>
        {card}
      </a>
    );
  }
  return card;
}
