import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const itemSchema = z.object({ id: z.string().min(1), quantity: z.number().int().min(1).max(99) });
const orderSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email().optional().or(z.literal("")),
  city: z.string().trim().min(2).max(100),
  branch: z.string().trim().min(1).max(120),
  comment: z.string().trim().max(1000).optional(),
  items: z.array(itemSchema).min(1).max(100)
});

function orderNumber() {
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  return `OKSA-${stamp}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

export async function POST(request: Request) {
  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Некоректні дані замовлення" }, { status: 400 });

  const ids = parsed.data.items.map((item) => item.id);
  const products = await prisma.product.findMany({ where: { id: { in: ids }, status: "ACTIVE" } });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = parsed.data.items.map((line) => {
    const product = byId.get(line.id);
    if (!product || !product.available) throw new Error("Товар недоступний");
    const price = Number(product.price);
    return { product, quantity: line.quantity, price, total: price * line.quantity };
  });

  const total = lines.reduce((sum, line) => sum + line.total, 0);
  const order = await prisma.order.create({
    data: {
      number: orderNumber(),
      customerName: parsed.data.name,
      customerPhone: parsed.data.phone,
      customerEmail: parsed.data.email || null,
      city: parsed.data.city,
      deliveryBranch: parsed.data.branch,
      comment: parsed.data.comment || null,
      total,
      items: { create: lines.map((line) => ({ productId: line.product.id, sku: line.product.sku, name: line.product.name, price: line.price, quantity: line.quantity, total: line.total })) }
    },
    select: { number: true, status: true, total: true }
  });

  return NextResponse.json({ ok: true, order: { ...order, total: order.total.toString() } }, { status: 201 });
}
