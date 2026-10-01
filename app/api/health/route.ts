import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const [productCount, activeProductCount, categoryCount, orderCount, latestImport] =
      await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { status: "ACTIVE" } }),
        prisma.category.count(),
        prisma.order.count(),
        prisma.importRun.findFirst({
          orderBy: { startedAt: "desc" },
          select: {
            status: true,
            processed: true,
            created: true,
            updated: true,
            failed: true,
            startedAt: true,
            finishedAt: true
          }
        })
      ]);

    return NextResponse.json({
      ok: true,
      service: "oksa-marketplace",
      database: "connected",
      productCount,
      activeProductCount,
      categoryCount,
      orderCount,
      latestImport,
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
