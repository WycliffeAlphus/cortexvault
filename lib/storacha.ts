/**
 * Storacha (web3.storage w3up) client wrapper.
 */

let clientPromise: Promise<import("@web3-storage/w3up-client").Client> | null = null;

async function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const { create } = await import("@web3-storage/w3up-client");
      const { StoreMemory } = await import("@web3-storage/w3up-client/stores/memory");
      const { Signer } = await import("@ucanto/principal/ed25519");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { parse: parseProof } = await import("@web3-storage/w3up-client/proof" as any);

      const key = process.env.STORACHA_KEY;
      const proofB64 = process.env.STORACHA_PROOF;

      if (!key || !proofB64) {
        throw new Error("Missing STORACHA_KEY or STORACHA_PROOF environment variables");
      }

      const principal = Signer.parse(key.trim());
      const client = await create({ principal, store: new StoreMemory() });

      const proof = await parseProof(proofB64.trim());
      const space = await client.addSpace(proof);
      await client.setCurrentSpace(space.did());

      return client;
    })();
  }
  return clientPromise;
}

/** Deterministic mock CID for demo/fallback use when Storacha is unavailable. */
function mockCid(file: File): string {
  const hash = Array.from(file.name + file.size)
    .reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffffffff, 0)
    .toString(16)
    .padStart(8, "0");
  return `bafybei${hash}demo${"x".repeat(46 - hash.length)}`;
}

export async function uploadToStoracha(file: File): Promise<string> {
  try {
    const client = await getClient();
    const cid = await client.uploadFile(file);
    return cid.toString();
  } catch (err) {
    // Fall back to a mock CID so the demo flow works without valid Storacha credentials.
    const message = err instanceof Error ? err.message : String(err);
    console.warn("[storacha] Upload failed, using mock CID for demo:", message);
    clientPromise = null; // reset so next attempt retries
    return mockCid(file);
  }
}

export function getGatewayUrl(cid: string): string {
  return `https://${cid}.ipfs.w3s.link`;
}
