/**
 * Africa's Talking SMS — direct API call (no SDK).
 * The africastalking npm package (0.7.9) does not support the new atsk_ key format,
 * so we call the REST API directly.
 */

export async function sendAccessNotification(
  phoneNumber: string,
  researcherName: string,
  accessDate: string
): Promise<void> {
  const apiKey = process.env.AT_API_KEY;
  const username = process.env.AT_USERNAME ?? "sandbox";

  if (!apiKey) {
    console.warn("[sms] AT_API_KEY not set — skipping SMS notification");
    return;
  }

  // Use sandbox endpoint when AT_USERNAME is "sandbox" OR AT_SANDBOX is set
  const isSandbox = process.env.AT_SANDBOX === "true" || username.trim().toLowerCase() === "sandbox";
  const endpoint = isSandbox
    ? "https://api.sandbox.africastalking.com/version1/messaging"
    : "https://api.africastalking.com/version1/messaging";

  console.log("[sms] sending to:", phoneNumber, "endpoint:", endpoint, "username:", username.trim());

  const message = `CortexVault: ${researcherName} accessed your brain data on ${accessDate}. To revoke access visit your CortexVault dashboard.`;

  const body = new URLSearchParams({ username: username.trim(), to: phoneNumber, message });
  if (!isSandbox && process.env.AT_SENDER_ID) {
    body.set("from", process.env.AT_SENDER_ID);
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      apiKey,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AT API ${res.status}: ${text}`);
  }
}
