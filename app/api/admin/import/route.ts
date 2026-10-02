import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startSupplierImport } from "@/lib/importer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAdmin(request: NextRequest) {
  const expected = process.env.ADMIN_ACCESS_TOKEN;
  const supplied = request.cookies.get("oksa_admin_access")?.value;
  return Boolean(expected && supplied && supplied === expected);
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, ...(await startSupplierImport()) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Import failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const runId = new URL(request.url).searchParams.get("runId");
  if (!runId) return NextResponse.json({ error: "runId is required" }, { status: 400 });
  try {
    const run = await prisma.importRun.findUnique({ where: { id: runId }, select: { id: true, status: true, processed: true, created: true, updated: true, failed: true, error: true, startedAt: true, finishedAt: true } });
    if (!run) return NextResponse.json({ error: "Import run not found" }, { status: 404 });
    return NextResponse.json({ ok: true, run });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Failed to read import status" }, { status: 500 });
  }
}