/**
 * Africa's Talking SMS wrapper.
 * Sign up at africastalking.com for a free sandbox account.
 * Set AT_API_KEY and AT_USERNAME env vars (use "sandbox" as username for testing).
 */

export async function sendAccessNotification(
  phoneNumber: string,
  researcherName: string,
  accessDate: string
): Promise<void> {
  const apiKey = process.env.AT_API_KEY;
  const username = process.env.AT_USERNAME ?? "sandbox";

  if (!apiKey) {
    console.warn("AT_API_KEY not set — skipping SMS notification");
    return;
  }

  const AfricasTalking = (await import("africastalking")).default;
  const at = AfricasTalking({ apiKey, username });
  const sms = at.SMS;

  const message = `NeuroVault: ${researcherName} accessed your brain data on ${accessDate}. To revoke access visit your NeuroVault dashboard.`;

  await sms.send({
    to: [phoneNumber],
    message,
    from: process.env.AT_SENDER_ID,
  });
}
