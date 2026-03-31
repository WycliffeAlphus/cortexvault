import { NextRequest, NextResponse } from "next/server";
import { uploadToStoracha } from "@/lib/storacha";
import { supabase } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const patientWallet = (formData.get("patientWallet") as string | null) ?? "";
    const phoneNumber = (formData.get("phoneNumber") as string | null) ?? "";
    const encryptedPayload = (formData.get("encryptedPayload") as string | null) ?? "";
    const fileSize = Number(formData.get("fileSize") ?? 0);

    const cid = await uploadToStoracha(file);

    if (supabase && patientWallet && encryptedPayload) {
      const { error } = await supabase.from("datasets").upsert({
        cid,
        file_name: file.name,
        file_size: fileSize,
        patient_wallet: patientWallet,
        phone_number: phoneNumber,
        encrypted_payload: encryptedPayload,
      });
      if (error) console.error("[upload] DB save failed:", error.message);
    }

    return NextResponse.json({ cid });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("[upload]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
