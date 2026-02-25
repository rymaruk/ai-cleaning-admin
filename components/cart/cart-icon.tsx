"use client";

import * as React from "react";
import { useCart } from "@/context/cart-context";

type CartIconProps = {
  onClick: () => void;
  className?: string;
};

export function CartIcon({ onClick, className }: CartIconProps) {
  const { itemCount } = useCart();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className ?? ""}`}
      aria-label={`Кошик, товарів: ${itemCount}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
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
      {itemCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </button>
  );
}
