"use client";

import { type ChangeEvent, useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const LOADING_PHRASES = [
  "Майже готово...",
  "Підбираємо ідеальні варіанти...",
  "Готуємо щоб запропонувати найкраще...",
  "Ми вже знайшли те що вам потрібно...",
  "Ще мить і ваше рішення готове...",
] as const;
const PHRASE_ROTATE_MS = 5000;

const QUERY_EXAMPLES = ["помити вікна", "прибрати шерсть з килима", "почистити бруківку"] as const;

type SearchFormProps = {
  query: string;
  setQuery: (q: string) => void;
  matchCount: number;
  setMatchCount: (n: number) => void;
  minSimilarity: number;
  setMinSimilarity: (n: number) => void;
  loading: boolean;
  error: string | null;
  search: (overrideQuery?: string) => Promise<void>;
  handleKeyDown: (e: unknown) => void;
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
  search,
  handleKeyDown,
}: SearchFormProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input after a short delay so it works when rendered in iframe/widget
  useEffect(() => {
    const id = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(id);
  }, []);

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
        <div className="min-w-0">
          <h2 className="text-xl font-semibold leading-none tracking-tight mb-2">
            Агент з прибирання
          </h2>
          {loading ? (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span
                className="size-5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden
              />
              <span>{LOADING_PHRASES[phraseIndex]}</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Опишіть забруднення, а ми підберемо ідеальне рішення
            </p>
          )}
        </div>
        <Image
          src="https://appiclean.com.ua/content/images/2/400x200l90nn0/36284949921856.webp"
          alt="Appiclean"
          width={120}
          height={60}
          className="shrink-0 object-contain"
        />
      </div>
      <div className="space-y-2">
        <div className="relative mb-4">
          <Input
            ref={inputRef}
            type="text"
            placeholder=""
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[46px] resize-none w-full py-2 pr-24"
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
        <p className="text-xs text-muted-foreground">
          Найчастіше запитують:{" "}
          {QUERY_EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setQuery(example);
                search(example);
              }}
              className="mr-1.5 rounded border border-border bg-muted/50 px-1.5 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {example}
            </button>
          ))}
        </p>
      </div>
      <div className="hidden flex flex-wrap items-center gap-4">
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
