"use client";

import { useState } from "react";
import type { CartItem } from "@/lib/cart";
import { normalizeCart } from "@/lib/cart";

const KEY = "oksa-cart";

type Props = {
  item: CartItem;
};

export default function AddToCartButton({ item }: Props) {
  const [added, setAdded] = useState(false);

  function addToCart() {
    try {
      const current = JSON.parse(localStorage.getItem(KEY) || "[]") as CartItem[];
      const next = normalizeCart([...current, { ...item, quantity: 1 }]);
      localStorage.setItem(KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("oksa-cart-updated"));
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1800);
    } catch {
      setAdded(false);
    }
  }

  return (
    <button
      className="primary-button add-cart"
      type="button"
      onClick={addToCart}
      disabled={!item.available}
      aria-live="polite"
    >
      {added ? "Додано до кошика ✓" : item.available ? "Додати до кошика" : "Немає в наявності"}
      <span>{added ? "" : "→"}</span>
    </button>
  );
}
