"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductMatch } from "@/lib/product-types";
import { formatPrice } from "@/lib/utils/format";
import { getProductImageUrl } from "@/lib/utils/products";

type ProductDetailModalProps = {
  product: ProductMatch | null;
  query: string;
  open: boolean;
  onClose: () => void;
};

type ReasonState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; reason: string; usage_tip: string }
  | { status: "error"; message: string };

export function ProductDetailModal({
  product,
  query,
  open,
  onClose,
}: ProductDetailModalProps) {
  const [reasonState, setReasonState] = useState<ReasonState>({ status: "idle" });

  useEffect(() => {
    if (!open || !product || !query.trim()) {
      setReasonState({ status: "idle" });
      return;
    }
    setReasonState({ status: "loading" });
    fetch("/api/product-reason", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query.trim(),
        product: {
          id: product.id,
          name: product.name,
          brand: product.brand,
          category_name: product.category_name,
          price: product.price,
          images: product.images,
          url: product.url,
        },
      }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => Promise.reject(new Error(d?.error ?? "Request failed")));
        return res.json();
      })
      .then((data: { reason: string; usage_tip: string }) => {
        setReasonState({
          status: "loaded",
          reason: data.reason ?? "",
          usage_tip: data.usage_tip ?? "",
        });
      })
      .catch((err) => {
        setReasonState({
          status: "error",
          message: err instanceof Error ? err.message : "Не вдалося завантажити пораду",
        });
      });
  }, [open, product?.id, query]);

  if (!open) return null;

  const imageUrl = product ? getProductImageUrl(product) : null;
  const priceStr = product ? formatPrice(product.price) : "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
    >
      <div
        className="bg-background rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {product && (
          <>
            <div className="relative aspect-square w-full bg-white rounded-t-xl overflow-hidden">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={product.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 448px) 100vw, 448px"
                  unoptimized
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  Немає зображення
                </div>
              )}
            </div>
            <div className="p-4 space-y-4">
              <h2 id="product-detail-title" className="text-lg font-semibold leading-tight">
                {product.name}
              </h2>
              <p className="text-base font-medium text-green-600">{priceStr}</p>
              {(product.brand || product.category_name) && (
                <p className="text-xs text-muted-foreground">
                  {[product.brand, product.category_name].filter(Boolean).join(" · ")}
                </p>
              )}

              <div className="pt-2 border-none space-y-3">
                {reasonState.status === "loading" && (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                )}
                {reasonState.status === "loaded" && (
                  <div className="space-y-2 text-sm">
                    {reasonState.reason && (
                      <p className="text-muted-foreground">
                        {reasonState.reason}
                      </p>
                    )}
                    {reasonState.usage_tip && (
                      <p className="text-primary/90 italic">
                        <span className="font-medium text-foreground not-italic">Порада: </span>
                        {reasonState.usage_tip}
                      </p>
                    )}
                  </div>
                )}
                {reasonState.status === "error" && (
                  <p className="text-sm text-destructive">{reasonState.message}</p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Закрити
                </button>
                {product.url && (
                  <a
                    href={product.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 text-center"
                  >
                    Перейти до товару
                  </a>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
