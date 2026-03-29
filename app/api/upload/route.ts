import { NextRequest, NextResponse } from "next/server";
import { uploadToStoracha } from "@/lib/storacha";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const cid = await uploadToStoracha(file);
    return NextResponse.json({ cid });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("[upload]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
