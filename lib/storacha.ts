/**
 * Storacha (web3.storage w3up) client wrapper.
 * Signs up at web3.storage, gets a space DID, sets STORACHA_KEY and STORACHA_PROOF env vars.
 */

let clientPromise: Promise<import("@web3-storage/w3up-client").Client> | null = null;

async function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const { create } = await import("@web3-storage/w3up-client");
      const { StoreMemory } = await import("@web3-storage/w3up-client/stores/memory");
      const { importDAG } = await import("@ucanto/core/delegation");
      const { CarReader } = await import("@ipld/car");

      const client = await create({ store: new StoreMemory() });

      const key = process.env.STORACHA_KEY;
      const proof = process.env.STORACHA_PROOF;

      if (!key || !proof) {
        throw new Error("Missing STORACHA_KEY or STORACHA_PROOF environment variables");
      }

      const { Signer } = await import("@ucanto/principal/ed25519");
      const principal = Signer.parse(key);
      await client.addSpace(
        await importDAG(
          // @ts-expect-error — CarReader is iterable
          await CarReader.fromBytes(Buffer.from(proof, "base64"))
        )
      );
      await client.setCurrentSpace(principal.did());
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
