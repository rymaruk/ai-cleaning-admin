"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Order } from "@/lib/order-types";
import { formatPrice } from "@/lib/utils/format";
import { OrderDetailModal } from "@/components/order-detail-modal";

export default function OrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);

  const fetchOrders = React.useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = query
        ? `/api/orders?search=${encodeURIComponent(query)}`
        : "/api/orders";
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Не вдалося завантажити замовлення");
        setOrders([]);
        return;
      }
      setOrders(data.orders ?? []);
    } catch {
      setError("Помилка мережі");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchOrders(search);
  }, [search, fetchOrders]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const openOrder = (order: Order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← На головну
          </Link>
          <h1 className="text-xl font-semibold">Замовлення</h1>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Пошук замовлень (телефон, ім'я, ID…)"
            value={searchInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchInput(e.target.value)
            }
            className="flex-1"
          />
          <Button type="submit" variant="secondary">
            Шукати
          </Button>
        </form>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Завантаження…</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Замовлень не знайдено
          </p>
        ) : (
          <ul className="space-y-2">
            {orders.map((order) => (
              <li key={order.id}>
                <Card
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => openOrder(order)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">
                        {order.customer_name || "Без імені"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.customer_phone || "—"} · {order.items.length}{" "}
                        шт.
                      </p>
                    </div>
                    <p className="text-base font-semibold text-green-600">
                      {formatPrice(order.total)}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <OrderDetailModal
        order={selectedOrder}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
