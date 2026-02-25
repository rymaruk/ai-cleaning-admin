"use client";

import * as React from "react";
import { CartIcon } from "./cart-icon";
import { CartDrawer } from "./cart-drawer";

type CartWidgetProps = {
  /** When true, cart icon is visible (e.g. when search results with products are shown) */
  visible?: boolean;
  className?: string;
  /** When set, icon only triggers this callback (drawer is rendered by parent, e.g. page) */
  onOpenCart?: () => void;
};

export function CartWidget({ visible = true, className, onOpenCart }: CartWidgetProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const handleOpen = onOpenCart ?? (() => setDrawerOpen(true));
  const handleClose = () => setDrawerOpen(false);

  if (!visible) return null;

  return (
    <>
      <CartIcon onClick={handleOpen} className={className} />
      {!onOpenCart && (
        <CartDrawer open={drawerOpen} onClose={handleClose} />
      )}
    </>
  );
}

export { CartIcon } from "./cart-icon";
export { CartDrawer } from "./cart-drawer";
export { SelectionPanel } from "./selection-panel";
