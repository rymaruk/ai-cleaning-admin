"use client";

import * as React from "react";
import Image from "next/image";
import type { Order } from "@/lib/order-types";
import { formatPrice } from "@/lib/utils/format";
import { Separator } from "@/components/ui/separator";

type OrderDetailModalProps = {
  order: Order | null;
  open: boolean;
  onClose: () => void;
};

export function OrderDetailModal({ order, open, onClose }: OrderDetailModalProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
      >
        <div
          className="bg-background rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e: { stopPropagation: () => void }) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4">
            <h2 id="order-detail-title" className="text-lg font-semibold">
              Замовлення {order ? `#${order.id}` : ""}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Закрити"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          <Separator />
          <div className="flex-1 overflow-y-auto p-4">
            {!order ? (
              <p className="text-sm text-muted-foreground">Немає даних</p>
            ) : (
              <>
                <ul className="divide-y divide-border">
                  {order.items.map((item, index) => {
                    const imageUrl =
                      item.image_url && String(item.image_url).startsWith("http")
                        ? item.image_url
                        : null;
                    return (
                      <li
                        key={item.product_id || index}
                        className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={item.name}
                              fill
                              className="object-contain"
                              sizes="56px"
                              unoptimized
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
                              —
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <p className="text-sm font-medium line-clamp-2">
                            {item.name}
                          </p>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm text-muted-foreground">
                              {item.quantity} шт.
                            </span>
                            <p className="text-sm font-medium text-foreground">
                              {formatPrice(item.price)}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <Separator className="my-4" />
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Замовник: </span>
                    <span className="font-medium">{order.customer_name}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Телефон: </span>
                    <span className="font-medium">{order.customer_phone}</span>
                  </p>
                </div>
                <div className="mt-4 flex justify-between text-base font-semibold">
                  <span>Разом</span>
                  <span className="text-green-600">{formatPrice(order.total)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
