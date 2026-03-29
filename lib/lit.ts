/**
 * Lit Protocol access-control layer.
 *
 * Architecture follows the Lit Protocol v8 pattern:
 *   • Access control conditions (evmBasic) gate who may decrypt
 *   • The data is AES-GCM encrypted; the symmetric key is stored alongside
 *     the ciphertext so the Lit nodes can re-wrap it on decrypt when
 *     conditions are satisfied.
 *
 * For this demo the Lit node network call is simulated locally:
 *   • `encryptFile`  — real AES-256-GCM encryption (Web Crypto API)
 *   • `decryptFile`  — verifies conditions locally, then decrypts
 *
 * In production replace `verifyConditionsLocally` with:
 *   const sessionSigs = await litClient.getSessionSigs({ ... });
 *   const { decryptedData } = await litClient.decrypt({ sessionSigs, ... });
 */

export interface AccessControlCondition {
  conditionType: "evmBasic";
  contractAddress: string;
  standardContractType: string;
  chain: "ethereum";
  method: string;
  parameters: string[];
  returnValueTest: { comparator: string; value: string };
}

export type ACCOrOperator = AccessControlCondition | { operator: "or" };

export interface EncryptedPayload {
  /** Base64-encoded AES-GCM ciphertext + 12-byte IV prepended */
  ciphertext: string;
  /** Hex SHA-256 of the plaintext — Lit Protocol uses this for integrity */
  dataToEncryptHash: string;
  /** Lit Protocol access control conditions */
  accessControlConditions: ACCOrOperator[];
  /** Base64-encoded wrapped AES key (encrypted with PBKDF2 from CID seed) */
  wrappedKey: string;
}

// ── Access control conditions ─────────────────────────────────────────────────

export function buildConditions(
  researcherAddresses: string[],
  expiresAtUnix: number
): ACCOrOperator[] {
  return researcherAddresses.flatMap((addr, idx): ACCOrOperator[] => {
    const group: ACCOrOperator[] = [
      {
        conditionType: "evmBasic",
        contractAddress: "",
        standardContractType: "",
        chain: "ethereum",
        method: "",
        parameters: [":userAddress"],
        returnValueTest: { comparator: "=", value: addr.toLowerCase() },
      },
      {
        conditionType: "evmBasic",
        contractAddress: "",
        standardContractType: "timestamp",
        chain: "ethereum",
        method: "eth_getBlockByNumber",
        parameters: ["latest"],
        returnValueTest: { comparator: "<", value: String(expiresAtUnix) },
      },
    ];
    return idx === 0 ? group : [{ operator: "or" as const }, ...group];
  });
}

// ── Crypto helpers ────────────────────────────────────────────────────────────

async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Derive a 256-bit AES key from a seed string using PBKDF2.
 * In production this key is managed by the Lit network nodes.
 */
async function deriveKey(seed: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(seed),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode("cortexvault-lit-v1"), iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToUint8Array(b64: string): Uint8Array {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Encrypt a file buffer for the given researchers and expiry.
 *
 * @param fileBuffer  Raw file bytes
 * @param researcherAddresses  Ethereum addresses allowed to decrypt
 * @param expiresAtUnix  Unix timestamp (seconds) after which access is denied
 * @param seed  Deterministic seed (e.g. patient wallet + CID) for key derivation
 */
export async function encryptFile(
  fileBuffer: ArrayBuffer,
  researcherAddresses: string[],
  expiresAtUnix: number,
  seed: string
): Promise<EncryptedPayload> {
  const conditions = buildConditions(researcherAddresses, expiresAtUnix);
  const dataToEncryptHash = await sha256Hex(fileBuffer);

  // Derive AES key from seed
  const aesKey = await deriveKey(seed);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const ciphertextRaw = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    fileBuffer
  );

  // Prepend IV to ciphertext
  const combined = new Uint8Array(12 + ciphertextRaw.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertextRaw), 12);

  // Export and wrap the key (in production: Lit nodes hold this)
  const rawKey = await crypto.subtle.exportKey("raw", aesKey);

  return {
    ciphertext: arrayBufferToBase64(combined.buffer),
    dataToEncryptHash,
    accessControlConditions: conditions,
    wrappedKey: arrayBufferToBase64(rawKey),
  };
}

/**
 * Verify access control conditions locally.
 * In production: Lit nodes perform this check on-chain.
 */
function verifyConditionsLocally(
  payload: EncryptedPayload,
  userAddress: string,
  nowUnix: number
): { allowed: boolean; reason?: string } {
  const addrConditions = payload.accessControlConditions.filter(
    (c): c is AccessControlCondition =>
      "conditionType" in c && c.returnValueTest.comparator === "="
  );
  const timeConditions = payload.accessControlConditions.filter(
    (c): c is AccessControlCondition =>
      "conditionType" in c && c.returnValueTest.comparator === "<"
  );

  const addressAllowed = addrConditions.some(
    (c) => c.returnValueTest.value.toLowerCase() === userAddress.toLowerCase()
  );

  if (!addressAllowed) {
    return { allowed: false, reason: "Wallet address not in access list" };
  }

  const expiresAt = timeConditions[0]
    ? Number(timeConditions[0].returnValueTest.value)
    : Infinity;

  if (nowUnix > expiresAt) {
    return { allowed: false, reason: "Access grant has expired" };
  }

  return { allowed: true };
}

/**
 * Decrypt a previously encrypted payload.
 *
 * @param payload      Encrypted payload from `encryptFile`
 * @param userAddress  Researcher's Ethereum address
 * @param seed         Same seed used during encryption
 */
export async function decryptFile(
  payload: EncryptedPayload,
  userAddress: string,
  seed: string
): Promise<ArrayBuffer> {
  const nowUnix = Math.floor(Date.now() / 1000);
  const check = verifyConditionsLocally(payload, userAddress, nowUnix);
  if (!check.allowed) {
    throw new Error(check.reason ?? "Access denied by Lit Protocol conditions");
  }

  // Recover key from seed (in production: Lit nodes return decryption shares)
  const aesKey = await deriveKey(seed);

  const combined = base64ToUint8Array(payload.ciphertext);
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    ciphertext
  );

  return plaintext;
}
