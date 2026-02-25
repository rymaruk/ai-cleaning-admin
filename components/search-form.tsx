"use client";

import { type ChangeEvent } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  return (
    <div className="space-y-4 p-4 shrink-0">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h2 className="text-xl font-semibold leading-none tracking-tight">
            Агент з прибирання
          </h2>
          <p className="text-sm text-muted-foreground">
            Опишіть забруднення, а ми підберемо ідеальне рішення
          </p>
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
        <div className="relative">
          <Textarea
            placeholder="Наприклад: жирна пляма на кухонній стільниці, відбілювач для білизни..."
            value={query}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            className="resize-none pb-14 pr-4"
            disabled={loading}
          />
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between pointer-events-none">
            <span className="text-xs text-muted-foreground">
              Cmd/Ctrl + Enter — пошук
            </span>
            <span className="pointer-events-auto">
              <Button
                onClick={() => !loading ? search() : null}
                size="sm"
                className={loading ? "bg-expert-yellow-500 text-black hover:bg-expert-yellow-600" : undefined}
              >
                {loading ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    шукаємо ідеальне рішення...
                  </>
                ) : (
                  "Знайти"
                )}
              </Button>
            </span>
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
