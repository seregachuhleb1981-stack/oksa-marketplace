import { NextResponse } from "next/server";
import { startSupplierImport } from "@/lib/importer";
import { verifyGitHubOidcToken } from "@/lib/github-oidc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await verifyGitHubOidcToken(match[1]);
    return NextResponse.json({ ok: true, ...(await startSupplierImport()) });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unauthorized"
      },
      { status: 401 }
    );
  }
}
