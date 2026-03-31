import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { cid, patientWallet, researcherAddress, researcherName, purpose, expiresAt } = await req.json();

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

    if (supabase && patientWallet) {
      const { error } = await supabase.from("consent_grants").insert({
        id: grant.id,
        dataset_cid: cid,
        patient_wallet: patientWallet,
        researcher_address: researcherAddress.toLowerCase(),
        researcher_name: grant.researcherName,
        purpose: grant.purpose,
        expires_at: expiresAt,
        revoked: false,
      });
      if (error) console.error("[grant] DB save failed:", error.message);
    }

    return NextResponse.json({ grant });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Grant failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
