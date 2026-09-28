export type CartItem = { id:string; sku:string; name:string; slug:string; price:number; image?:string|null; quantity:number; available:boolean };

export function normalizeCart(items: CartItem[]) {
  const map = new Map<string, CartItem>();
  for (const item of items) {
    if (item.quantity < 1) continue;
    const current = map.get(item.id);
    map.set(item.id, { ...item, quantity: Math.min(99, (current?.quantity ?? 0) + item.quantity) });
  }
  return [...map.values()];
}
