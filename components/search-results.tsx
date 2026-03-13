"use client";

import * as React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ProductMatch } from "@/lib/product-types";
import type { RecommendedItem } from "@/lib/utils/recommendations";
import { AdviceHtml } from "@/components/advice-html";
import { RecommendationCard } from "@/components/recommendation-card";
import { ProductCard } from "@/components/product-card";
import { ProductDetailModal } from "@/components/product-detail-modal";
import { SelectionPanel } from "@/components/cart";
import { useCart } from "@/context/cart-context";

type SearchResultsProps = {
  loading: boolean;
  query: string;
  matches: ProductMatch[];
  recommendation: { advice_text: string } | null;
  recommendedList: RecommendedItem[];
  adviceSectionRef: React.RefObject<HTMLDivElement | null>;
  onOpenSelection?: () => void;
  /** When set, "Купити" opens cart drawer with this product (fast purchase) instead of adding to cart */
  onBuyProduct?: (product: ProductMatch) => void;
};

export function SearchResults({
  loading,
  query,
  matches,
  recommendation,
  recommendedList,
  adviceSectionRef,
  onOpenSelection,
  onBuyProduct,
}: SearchResultsProps) {
  const [selectedProduct, setSelectedProduct] = React.useState<ProductMatch | null>(null);
  const [showBoxShadow, setShowBoxShadow] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { addItem } = useCart();
  const handleAddToCart = onBuyProduct ?? addItem;
  const showResults = !loading && matches.length > 0;

  const handleScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowBoxShadow(el.scrollTop > 50);
  }, []);

  return (
    <div
      className={
        showResults
          ? "flex flex-col shrink-0 h-[62vh] min-h-[240px] border-b"
          : "flex flex-col shrink-0 h-[0vh] min-h-[0px]"
      }
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="overflow-y-auto flex-1 px-4 pt-0 pb-4 border-none"
      >
        {showResults && (
          <>
            <div
              className={`h-[60px] sticky top-0 left-0 z-10 mx-[-15px] px-[20px] mb-4 flex items-center justify-between gap-4 bg-white transition-shadow duration-200 ${showBoxShadow ? "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)]" : ""}`}
            >
              <h2 className="text-xl font-semibold text-foreground shrink-0">
                Ваше рішення щоб <span className="text-yellow-400">{query.trim()}</span>
              </h2>
            </div>
            {recommendation?.advice_text && (
              <div ref={adviceSectionRef} className="mb-8">
                <Card className="border-none shadow-none">
                  <CardContent className="p-0 border-none shadow-none">
                    <div className="relative translate-x-[-10px] translate-y-[-10px]">
                      <Image
                        src="/cleaning-robot-3d-icon-png-download-13763983.png"
                        alt="Помічник з прибирання"
                        width={62}
                        height={62}
                        className="relative z-10 shrink-0 w-18 h-18 object-contain"
                      />
                      <Badge className="z-9 absolute top-6 left-12 py-1.25 pl-6" variant="expert" label="Порада експерта APPI Clean" />
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="min-w-0 flex-1 pr-4">
                        <AdviceHtml content={recommendation.advice_text} products={matches} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            {recommendedList.length > 0 && (
              <>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {recommendedList.map((item) => (
                    <RecommendationCard
                      key={item.product.id}
                      product={item.product}
                      reason={item.reason}
                      usageTip={item.usageTip}
                      confidence={item.confidence}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
                <Separator className="my-4" />
              </>
            )}
            <p className="text-sm text-muted-foreground mb-4">Також рекомендуємо звернути увагу:</p>
            <div className="grid grid-cols-4 gap-4">
              {matches.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onCardClick={(p) => setSelectedProduct(p)}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
            <ProductDetailModal
              product={selectedProduct}
              query={query}
              open={selectedProduct !== null}
              onClose={() => setSelectedProduct(null)}
              onBuyProduct={onBuyProduct}
            />
          </>
        )}
      </div>
    </div>
  );
}
