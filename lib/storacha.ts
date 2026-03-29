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

      const principal = Signer.parse(key);
      const client = await create({ principal, store: new StoreMemory() });

      const proof = await parseProof(proofB64);
      const space = await client.addSpace(proof);
      await client.setCurrentSpace(space.did());

      return client;
    })();
  }
  return clientPromise;
}

export async function uploadToStoracha(file: File): Promise<string> {
  const client = await getClient();
  const cid = await client.uploadFile(file);
  return cid.toString();
}

export function getGatewayUrl(cid: string): string {
  return `https://${cid}.ipfs.w3s.link`;
}
