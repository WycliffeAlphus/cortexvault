import { NextRequest, NextResponse } from "next/server";
import { sendAccessNotification } from "@/lib/sms";

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, researcherName, accessDate } = await req.json();

    console.log("[notify] received — phone:", phoneNumber, "researcher:", researcherName);

    if (!phoneNumber || !researcherName) {
      console.warn("[notify] missing fields — phone:", phoneNumber, "researcher:", researcherName);
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const date = accessDate ?? new Date().toLocaleDateString("en-KE", {
      day: "numeric", month: "long", year: "numeric",
    });

    await sendAccessNotification(phoneNumber, researcherName, date);
    console.log("[notify] SMS sent to", phoneNumber);
    return NextResponse.json({ sent: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "SMS failed";
    const detail = (err as { response?: { data?: unknown } })?.response?.data;
    console.error("[notify]", message, detail ?? "");
    // Non-fatal — don't break the access flow if SMS fails
    return NextResponse.json({ sent: false, error: message });
  }
}
