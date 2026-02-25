"use client";

import { useCart } from "@/context/cart-context";

type SelectionPanelProps = {
  onOpen: () => void;
};

export function SelectionPanel({ onOpen }: SelectionPanelProps) {
  const { itemCount } = useCart();

  if (itemCount === 0) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex items-center gap-2 rounded-md border border-transparent bg-expert-yellow-500 px-2.5 py-0.5 text-xs font-semibold text-black transition-colors hover:bg-expert-yellow-600 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-expert-yellow-500 dark:text-black dark:hover:bg-expert-yellow-600"
      aria-label="Відкрити обране"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      <span>Обрано товарів</span>
      <span className="rounded-full bg-black/15 px-1.5 py-0.5 font-medium">
        {itemCount}
      </span>
    </button>
  );
}
