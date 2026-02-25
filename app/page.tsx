"use client";
/// <reference path="../global.d.ts" />

import { Card, CardContent } from "@/components/ui/card";
import { useProductSearch } from "@/hooks/use-product-search";
import { SearchForm } from "@/components/search-form";
import { SearchResults } from "@/components/search-results";

export default function Home() {
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-3xl">
        <Card className="flex flex-col overflow-hidden shadow-lg">
          <CardContent className="flex flex-col min-h-0 p-0 border-none">
            <SearchResults
              loading={loading}
              query={query}
              matches={matches}
              recommendation={recommendation}
              recommendedList={recommendedList}
              adviceSectionRef={adviceSectionRef}
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
              search={search}
              handleKeyDown={handleKeyDown}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
