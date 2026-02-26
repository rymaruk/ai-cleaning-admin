"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
};

export function SearchResults({
  loading,
  query,
  matches,
  recommendation,
  recommendedList,
  adviceSectionRef,
  onOpenSelection,
}: SearchResultsProps) {
  const [selectedProduct, setSelectedProduct] = React.useState<ProductMatch | null>(null);
  const [showBoxShadow, setShowBoxShadow] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { addItem } = useCart();
  const showResults = !loading && matches.length > 0;

  const handleScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowBoxShadow(el.scrollTop > 50);
  }, []);

  return (
    <div
      className={
        loading || matches.length > 0
          ? "flex flex-col shrink-0 h-[62vh] min-h-[240px] border-b"
          : "flex flex-col shrink-0 h-[0vh] min-h-[0px]"
      }
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="overflow-y-auto flex-1 px-4 pt-0 pb-4 border-none"
      >
        {loading && <ResultsSkeleton />}
        {showResults && (
          <>
            <div
              className={`h-[60px] sticky top-0 left-0 z-10 mx-[-15px] px-[20px] mb-4 flex items-center justify-between gap-4 bg-white transition-shadow duration-200 ${showBoxShadow ? "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)]" : ""}`}
            >
              <h2 className="text-xl font-semibold text-foreground shrink-0">
                Ваше рішення щоб <span className="text-yellow-400">{query.trim()}</span>
              </h2>
              {onOpenSelection && <SelectionPanel onOpen={onOpenSelection} />}
            </div>
            {recommendation?.advice_text && (
              <div ref={adviceSectionRef} className="mb-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <Badge variant="expert" label="Порада експерта APPI Clean" />
                    </div>
                    <AdviceHtml content={recommendation.advice_text} products={matches} />
                  </CardContent>
                </Card>
              </div>
            )}
            {recommendedList.length > 0 && (
              <>
                <p className="text-sm font-medium text-foreground mb-2">Рекомендовано</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-4">
                  {recommendedList.map((item) => (
                    <RecommendationCard
                      key={item.product.id}
                      product={item.product}
                      reason={item.reason}
                      usageTip={item.usageTip}
                      confidence={item.confidence}
                      onAddToCart={addItem}
                    />
                  ))}
                </div>
                <Separator className="my-4" />
              </>
            )}
            <p className="text-sm text-muted-foreground mb-3">Усі результати ({matches.length})</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {matches.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onCardClick={(p) => setSelectedProduct(p)}
                  onAddToCart={addItem}
                />
              ))}
            </div>
            <ProductDetailModal
              product={selectedProduct}
              query={query}
              open={selectedProduct !== null}
              onClose={() => setSelectedProduct(null)}
            />
          </>
        )}
      </div>
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <>
      <Card className="mb-4 border-none shadow-none mb-6 pt-4">
        <CardContent className="p-0 border-none">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-4/5" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-none">
            <Skeleton className="aspect-square w-full rounded-t-xl" />
            <CardContent className="p-4">
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
