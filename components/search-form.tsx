"use client";

import { type ChangeEvent, useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ProductContextBrief } from "@/lib/product-types";

const LOADING_PHRASES = [
  "Підбираємо найкраще...",
  "Ми вже знайшли те що вам потрібно...",
  "Ще мить і ваше рішення готове...",
  "Майже готово...",
  "Вже готові показати...",
] as const;
const PHRASE_ROTATE_MS = 5000;

const QUERY_EXAMPLES = [ "миючий пилосос", "відмити плісняву на вікнах", "прибрати шерсть з килима", "почистити бруківку"] as const;

type SearchFormProps = {
  query: string;
  setQuery: (q: string) => void;
  matchCount: number;
  setMatchCount: (n: number) => void;
  minSimilarity: number;
  setMinSimilarity: (n: number) => void;
  loading: boolean;
  error: string | null;
  hasResults: boolean;
  search: (overrideQuery?: string) => Promise<void>;
  handleKeyDown: (e: unknown) => void;
  contextProduct: ProductContextBrief | null;
  onClearProductContext: () => void;
  onProductContextUrl?: (url: string) => void;
};

export function SearchForm({
  query,
  setQuery,
  matchCount,
  setMatchCount,
  minSimilarity,
  setMinSimilarity,
  loading,
  error,
  hasResults,
  search,
  handleKeyDown,
  contextProduct,
  onClearProductContext,
  onProductContextUrl,
}: SearchFormProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const data = event.data as { type?: string; url?: string } | null;
      if (data?.type === "AI_WIDGET_FOCUS_INPUT") {
        setTimeout(() => {
          inputRef.current?.focus();
          inputRef.current?.click();
        }, 0);
      }
      if (data?.type === "AI_WIDGET_SET_PRODUCT_CONTEXT" && typeof data.url === "string" && data.url.trim()) {
        void onProductContextUrl?.(data.url.trim());
      }
    }

    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);
  }, [onProductContextUrl]);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % LOADING_PHRASES.length);
    }, PHRASE_ROTATE_MS);
    return () => clearInterval(id);
  }, [loading]);

  return (
    <div className="space-y-4 p-4 shrink-0">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 w-full">
          {!hasResults && (
            <div className="w-full flex items-start justify-between gap-4">
              <div className={"w-full flex flex-col items-start justify-start"}>
                <Image
                  src="https://appiclean.com.ua/content/images/2/400x200l90nn0/36284949921856.webp"
                  alt="Appiclean"
                  width={60}
                  height={20}
                  className="shrink-0 object-contain -ml-1.5 -mt-2 mb-2"
                />
                  <h2 className="text-md lg:text-xl font-semibold leading-none tracking-tight mb-2">
                    AI Експерт
                  </h2>
              </div>
              <Button
                type="button"
                size="sm"
                variant="link"
                className="ml-auto px-2 py-0 -mr-2.5 -mt-2.5"
                aria-label="Закрити"
                onClick={() => {
                  window.parent?.postMessage({ type: "AI_WIDGET_CLOSE" }, "*");
                }}
              >
                <X
                  className="h-8 w-8"
                />
              </Button>
            </div>
          )}
          {loading ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span
                className="size-5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden
              />
              <span>{LOADING_PHRASES[phraseIndex]}</span>
            </div>
          ) : !hasResults ? (
            <p className="text-sm text-muted-foreground">
              {contextProduct
                ? "Привіт! Напиши своє питання по товару ⤵"
                : "Привіт! Напиши, що шукаєш - підберемо ідеальне рішення"}
            </p>
          ) : null}
        </div>
      </div>
      <div className="space-y-2">
        {contextProduct && (
          <div className="mb-3 flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-2">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
              {contextProduct.imageUrl ? (
                <Image
                  src={contextProduct.imageUrl}
                  alt={contextProduct.name}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] text-muted-foreground">
                  Немає фото
                </div>
              )}
            </div>
            <p className="min-w-0 flex-1 text-sm font-medium leading-snug">{contextProduct.name}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label="Прибрати товар з контексту"
              onClick={onClearProductContext}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}
        <div className="relative mb-4">
          <Input
            ref={inputRef}
            type="text"
            maxLength={120}
            placeholder=""
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-11.5 resize-none w-full py-2 pr-24"
            disabled={loading}
          />
          <div className="absolute inset-y-0 right-0 z-10 flex items-stretch pr-2 py-1.5">
            <Button
              onClick={() => !loading ? search() : null}
              size="sm"
              disabled={loading || !query.trim().length}
            >
                <span className="inline-flex items-center gap-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </span>
            </Button>
          </div>
        </div>
        {!hasResults && !query.trim().length && !contextProduct && (
          <p className="text-xs text-muted-foreground flex flex-wrap gap-2">
            {QUERY_EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setQuery(example);
                  search(example);
                }}
                className="rounded border border-border bg-muted/50 px-1.5 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {example}
              </button>
            ))}
          </p>
        )}
      </div>
      <div className="hidden flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="matchCount" className="text-sm text-muted-foreground">
            Кількість:
          </label>
          <Input
            id="matchCount"
            type="number"
            min={1}
            max={100}
            value={matchCount}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setMatchCount(Math.min(100, Math.max(1, Number(e.target.value) || 1)))
            }
            className="w-20"
            disabled={loading}
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="minSim" className="text-sm text-muted-foreground">
            Мін. схожість:
          </label>
          <Input
            id="minSim"
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={minSimilarity}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setMinSimilarity(Math.min(1, Math.max(0, Number(e.target.value) || 0)))
            }
            className="w-20"
            disabled={loading}
          />
        </div>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Помилка</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
