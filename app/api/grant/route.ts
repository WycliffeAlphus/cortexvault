import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/grant
 * Body: { cid, researcherAddress, expiresAt }
 *
 * Stores the updated access condition metadata in the response so the client
 * can save it to localStorage alongside the encrypted payload CID.
 * The actual Lit Protocol encryption happens on the client (lib/lit.ts) because
 * it requires the user's wallet/auth-sig — this route just validates input and
 * could optionally write to a backend DB.
 */
export async function POST(req: NextRequest) {
  try {
    const { cid, researcherAddress, researcherName, purpose, expiresAt } = await req.json();

    if (!cid || !researcherAddress || !expiresAt) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const grant = {
      id: crypto.randomUUID(),
      datasetCid: cid,
      researcherAddress,
      researcherName: researcherName ?? researcherAddress.slice(0, 8),
      purpose: purpose ?? "Unspecified",
      expiresAt,
      revoked: false,
    };

    return NextResponse.json({ grant });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Grant failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
