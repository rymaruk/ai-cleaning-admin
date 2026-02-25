"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProductMatch } from "@/lib/product-types";
import type { RecommendedItem } from "@/lib/utils/recommendations";
import { formatPrice } from "@/lib/utils/format";
import { getProductImageUrl } from "@/lib/utils/products";

const CARD_LINK_CLASS =
  "block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl";

type RecommendationCardProps = RecommendedItem;

export function RecommendationCard({
  product,
  reason,
  usageTip,
}: RecommendationCardProps) {
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
        <p className="text-base font-medium leading-tight line-clamp-2">{product.name}</p>
        <p className="text-sm font-medium text-green-600">{priceStr}</p>
        <p className="text-xs text-muted-foreground">{reason}</p>
        <p className="text-xs text-primary/90 italic">{usageTip}</p>
        {(product.brand || product.category_name) && (
          <p className="text-xs text-muted-foreground">
            {[product.brand, product.category_name].filter(Boolean).join(" · ")}
          </p>
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
