"use client";

import { useState, useCallback, useRef } from "react";

export type UseQueryLogOptions = {
  /** If you have an authenticated user id (e.g. from Supabase Auth), pass it so logs are tied to the user. */
  userId?: string | null;
};

export type UseQueryLogResult = {
  /** Logs an AI agent query. Fire-and-forget; does not log empty/whitespace-only query. */
  logQuery: (query: string, metadata?: Record<string, unknown>) => void;
  /** True while a log request is in flight (for optional UI). */
  logging: boolean;
};

/**
 * Hook to record AI agent query logs via the server API.
 * Use alongside your search flow: call logQuery(query) when the user submits a query
 * (e.g. after starting search, or when opening the widget).
 * Server captures IP and user-agent; pass userId if you have an authenticated user.
 */
export function useQueryLog(options: UseQueryLogOptions = {}): UseQueryLogResult {
  const { userId = null } = options;
  const stateRef = useRef<{ inFlight: boolean }>({ inFlight: false });
  const [logging, setLogging] = useState(false);

  const logQuery = useCallback(
    (query: string, metadata?: Record<string, unknown>) => {
      const trimmed = query?.trim();
      if (!trimmed) return;
      const box = stateRef.current;
      if (!box || box.inFlight) return;

      box.inFlight = true;
      setLogging(true);
      fetch("/api/log-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query_text: trimmed,
          user_id: userId ?? undefined,
          metadata: metadata ?? undefined,
        }),
      })
        .then((res) => {
          if (!res.ok) {
            console.warn("[useQueryLog] Log request failed:", res.status);
          }
        })
        .catch(() => {
          // Fire-and-forget; avoid breaking the app
        })
        .finally(() => {
          box.inFlight = false;
          setLogging(false);
        });
    },
    [userId]
  );

  return { logQuery, logging };
}
