// @ts-nocheck
/**
 * Lit Protocol v8 wrapper — encrypt, decrypt, grant, revoke access conditions.
 * Uses Naga Dev testnet.
 *
 * NOTE: The Lit Protocol SDK API surface changes frequently across major versions.
 * This file uses @ts-nocheck so you can update the internals when you wire up
 * real wallets on Day 2 without fighting type errors.
 *
 * Real integration checklist (Day 2):
 *   1. Install @lit-protocol/crypto and @lit-protocol/auth-helpers
 *   2. Replace encryptString / decryptString imports below with the correct v8 path
 *   3. Replace authSig with a SessionSigs flow from auth-helpers
 */

export interface AccessCondition {
  researcherAddress: string;
  expiresAt: number;
}

export interface EncryptedPayload {
  ciphertext: string;
  dataToEncryptHash: string;
  accessControlConditions: ReturnType<typeof buildConditions>;
}

function buildConditions(researcherAddresses: string[], expiresAt: number) {
  const conditions = researcherAddresses.flatMap((addr, idx) => {
    const group = [
      {
        conditionType: "evmBasic",
        contractAddress: "",
        standardContractType: "",
        chain: "ethereum",
        method: "",
        parameters: [":userAddress"],
        returnValueTest: { comparator: "=", value: addr },
      },
      {
        conditionType: "evmBasic",
        contractAddress: "",
        standardContractType: "timestamp",
        chain: "ethereum",
        method: "eth_getBlockByNumber",
        parameters: ["latest"],
        returnValueTest: { comparator: "<", value: String(expiresAt) },
      },
    ];
    return idx === 0 ? group : [{ operator: "or" }, ...group];
  });
  return conditions;
}

async function getLitClient() {
  const { LitNodeClient } = await import("@lit-protocol/lit-node-client");
  const client = new LitNodeClient({ litNetwork: "naga-dev", debug: false });
  await client.connect();
  return client;
}

export async function encryptFile(
  file: ArrayBuffer,
  researcherAddresses: string[],
  expiresAt: number
): Promise<EncryptedPayload> {
  const client = await getLitClient();
  const conditions = buildConditions(researcherAddresses, expiresAt);
  const base64 = Buffer.from(file).toString("base64");

  // encryptString was moved in v7+; adjust the import path when wiring Day 2
  const litCrypto = await import("@lit-protocol/lit-node-client").catch(() => null);
  const encryptFn = litCrypto?.encryptString ?? litCrypto?.default?.encryptString;
  if (!encryptFn) throw new Error("encryptString not found — update @lit-protocol SDK import path");

  const { ciphertext, dataToEncryptHash } = await encryptFn(
    { accessControlConditions: conditions, dataToEncrypt: base64 },
    client
  );
  await client.disconnect();
  return { ciphertext, dataToEncryptHash, accessControlConditions: conditions };
}

export async function decryptFile(
  payload: EncryptedPayload,
  authSig: Record<string, unknown>
): Promise<ArrayBuffer> {
  const client = await getLitClient();
  const litCrypto = await import("@lit-protocol/lit-node-client").catch(() => null);
  const decryptFn = litCrypto?.decryptString ?? litCrypto?.default?.decryptString;
  if (!decryptFn) throw new Error("decryptString not found — update @lit-protocol SDK import path");

  const decrypted = await decryptFn(
    {
      accessControlConditions: payload.accessControlConditions,
      ciphertext: payload.ciphertext,
      dataToEncryptHash: payload.dataToEncryptHash,
      authSig,
      chain: "ethereum",
    },
    client
  );
  await client.disconnect();
  return Buffer.from(decrypted, "base64");
}
