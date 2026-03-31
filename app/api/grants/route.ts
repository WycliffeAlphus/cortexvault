import { NextRequest, NextResponse } from "next/server";
import { supabase, type DbDataset, type DbGrant } from "@/lib/db";

export async function GET(req: NextRequest) {
  const researcher = req.nextUrl.searchParams.get("researcher");
  if (!researcher) {
    return NextResponse.json({ error: "Missing researcher address" }, { status: 400 });
  }

  if (!supabase) {
    return NextResponse.json({ grants: [] });
  }

  const { data: grantRows, error: grantErr } = await supabase
    .from("consent_grants")
    .select("*")
    .eq("researcher_address", researcher.toLowerCase());

  if (grantErr) {
    return NextResponse.json({ error: grantErr.message }, { status: 500 });
  }

  const rows = (grantRows ?? []) as DbGrant[];
  const cids = [...new Set(rows.map((g) => g.dataset_cid))];

  let datasetMap: Record<string, DbDataset> = {};
  if (cids.length > 0) {
    const { data: datasetRows } = await supabase
      .from("datasets")
      .select("*")
      .in("cid", cids);
    for (const d of (datasetRows ?? []) as DbDataset[]) {
      datasetMap[d.cid] = d;
    }
  }

  const grants = rows.map((g) => ({
    id: g.id,
    datasetCid: g.dataset_cid,
    patientWallet: g.patient_wallet,
    researcherAddress: g.researcher_address,
    researcherName: g.researcher_name,
    purpose: g.purpose,
    expiresAt: g.expires_at,
    revoked: g.revoked,
    dataset: datasetMap[g.dataset_cid]
      ? {
          cid: datasetMap[g.dataset_cid].cid,
          fileName: datasetMap[g.dataset_cid].file_name,
          fileSize: datasetMap[g.dataset_cid].file_size,
          encryptedPayload: datasetMap[g.dataset_cid].encrypted_payload,
          uploadedAt: datasetMap[g.dataset_cid].uploaded_at,
          phoneNumber: datasetMap[g.dataset_cid].phone_number,
        }
      : undefined,
  }));

  return NextResponse.json({ grants });
}
