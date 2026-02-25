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

export default function Home() {
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const { clear } = useCart();
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
    <div className="flex min-h-screen flex-col bg-muted/30 p-4">
      <div className="absolute right-4 top-4">
        <Link
          href="/orders"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Замовлення
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-3xl">
        <Card className="relative flex flex-col overflow-hidden shadow-lg">
          <CardContent className="flex flex-col min-h-0 p-0 border-none">
            <SearchResults
              loading={loading}
              query={query}
              matches={matches}
              recommendation={recommendation}
              recommendedList={recommendedList}
              adviceSectionRef={adviceSectionRef}
              onOpenSelection={() => setCartDrawerOpen(true)}
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
            onClose={() => setCartDrawerOpen(false)}
            scoped
            query={query}
          />
        </Card>
      </div>
      </div>
    </div>
  );
}
