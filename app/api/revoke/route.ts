import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/revoke
 * Body: { grantId }
 *
 * In production this would update a backend DB so the revocation is persisted.
 * For the hackathon demo the client mirrors revocation in localStorage, and Lit
 * conditions are updated client-side via lib/lit.ts.
 */
export async function POST(req: NextRequest) {
  try {
    const { grantId } = await req.json();

    if (!grantId) {
      return NextResponse.json({ error: "Missing grantId" }, { status: 400 });
    }

    return NextResponse.json({ revoked: true, grantId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Revoke failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
