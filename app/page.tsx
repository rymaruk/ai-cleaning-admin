"use client";
/// <reference path="../global.d.ts" />

import { useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useProductSearch } from "@/hooks/use-product-search";
import { SearchForm } from "@/components/search-form";
import { SearchResults } from "@/components/search-results";
import { CartDrawer } from "@/components/cart";
import { useCart } from "@/context/cart-context";
import type { ProductMatch } from "@/lib/product-types";

export default function Home() {
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [fastPurchaseProduct, setFastPurchaseProduct] = useState<ProductMatch | null>(null);
  const { clear } = useCart();

  const openDrawerWithProduct = useCallback((product: ProductMatch) => {
    setFastPurchaseProduct(product);
    setCartDrawerOpen(true);
  }, []);

  const closeCartDrawer = useCallback(() => {
    setCartDrawerOpen(false);
    setFastPurchaseProduct(null);
  }, []);
  const {
    query,
    setQuery,
    matchCount,
    setMatchCount,
    minSimilarity,
    setMinSimilarity,
    loading,
    error,
    matches,
    recommendation,
    recommendedList,
    search,
    handleKeyDown,
    adviceSectionRef,
  } = useProductSearch();

  const searchAndClearSelection = useCallback(
    (overrideQuery?: string) => {
      clear();
      return search(overrideQuery);
    },
    [clear, search]
  );

  return (
    <div className="flex min-h-screen flex-col bg-transparent p-0">
      <div className="flex flex-1 items-end justify-center">
        <div className="w-full p-24">
          <Card className="relative flex flex-col overflow-hidden shadow-[0px_0px_56px_#404040e8] border-[1px] border-[#fbd43900]">
          <CardContent className="flex flex-col min-h-0 p-0 border-none">
            <SearchResults
              loading={loading}
              query={query}
              matches={matches}
              recommendation={recommendation}
              recommendedList={recommendedList}
              adviceSectionRef={adviceSectionRef}
              onOpenSelection={() => setCartDrawerOpen(true)}
              onBuyProduct={openDrawerWithProduct}
            />
            <SearchForm
              query={query}
              setQuery={setQuery}
              matchCount={matchCount}
              setMatchCount={setMatchCount}
              minSimilarity={minSimilarity}
              setMinSimilarity={setMinSimilarity}
              loading={loading}
              error={error}
              search={searchAndClearSelection}
              handleKeyDown={handleKeyDown}
            />
          </CardContent>
          <CartDrawer
            open={cartDrawerOpen}
            onClose={closeCartDrawer}
            scoped
            query={query}
            fastPurchaseProduct={fastPurchaseProduct}
          />
        </Card>
        </div>
      </div>
    </div>
  );
}
