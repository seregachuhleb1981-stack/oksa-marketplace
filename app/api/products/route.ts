import { NextResponse } from "next/server";
import { getProducts } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") || "1");
  const result = await getProducts({ page: Number.isFinite(page) ? page : 1, q: url.searchParams.get("q") || undefined, category: url.searchParams.get("category") || undefined });
  return NextResponse.json({ ...result, items: result.items.map((item) => ({ id:item.id, sku:item.sku, name:item.name, slug:item.slug, description:item.description, price:item.price.toString(), oldPrice:item.oldPrice?.toString() ?? null, currency:item.currency, available:item.available, image:item.images[0]?.url ?? null, category:item.category?.name ?? null, brand:item.brand?.name ?? null })) });
}
