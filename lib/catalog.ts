import { prisma } from "@/lib/prisma";

export async function getProducts(input?: { q?: string; category?: string; page?: number; pageSize?: number }) {
  const page = Math.max(1, input?.page ?? 1);
  const pageSize = Math.min(48, Math.max(12, input?.pageSize ?? 24));
  const q = input?.q?.trim();
  const category = input?.category?.trim();
  const where = {
    status: "ACTIVE" as const,
    ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" as const } }, { sku: { contains: q, mode: "insensitive" as const } }] } : {}),
    ...(category ? { category: { slug: category } } : {})
  };
  const [items, total] = await Promise.all([
    prisma.product.findMany({ where, include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, category: true, brand: true }, orderBy: { updatedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.product.count({ where })
  ]);
  return { items, total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getProduct(slug: string) {
  return prisma.product.findUnique({ where: { slug }, include: { images: { orderBy: { sortOrder: "asc" } }, attributes: { orderBy: { name: "asc" } }, category: true, brand: true } });
}

export async function getCategories() {
  return prisma.category.findMany({ where: { parentId: null }, include: { children: { orderBy: { sortOrder: "asc" } } }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}
