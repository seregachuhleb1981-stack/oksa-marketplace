import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const productCount = await prisma.product.count();
    const categoryCount = await prisma.category.count();
    return NextResponse.json({
      ok: true,
      service: "oksa-marketplace",
      database: "connected",
      productCount,
      categoryCount,
      supplierFeedConfigured: Boolean(process.env.SUPPLIER_FEED_URL),
      importSecretConfigured: Boolean(process.env.IMPORT_SECRET)
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      service: "oksa-marketplace",
      database: "error",
      error: error instanceof Error ? error.message : "Database connection failed"
    }, { status: 503 });
  }
}
