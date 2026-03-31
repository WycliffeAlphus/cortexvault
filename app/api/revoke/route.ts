import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { grantId } = await req.json();

    if (!grantId) {
      return NextResponse.json({ error: "Missing grantId" }, { status: 400 });
    }

    if (supabase) {
      const { error } = await supabase
        .from("consent_grants")
        .update({ revoked: true })
        .eq("id", grantId);
      if (error) console.error("[revoke] DB update failed:", error.message);
    }

    return NextResponse.json({ revoked: true, grantId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Revoke failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
