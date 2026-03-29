/**
 * Client-side localStorage store for datasets, grants, and audit log.
 * All data is keyed by wallet address so different users share one device safely.
 */

import type { ConsentGrant } from "@/components/ConsentCard";
import type { AuditEvent } from "@/components/AuditLog";

export interface Dataset {
  cid: string;
  fileName: string;
  encryptedPayload: string; // JSON-stringified EncryptedPayload
  uploadedAt: string;
  phoneNumber: string;
}

const KEYS = {
  datasets: (wallet: string) => `nv:datasets:${wallet}`,
  grants: (wallet: string) => `nv:grants:${wallet}`,
  auditLog: (wallet: string) => `nv:audit:${wallet}`,
  wallet: "nv:wallet",
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ── Wallet ────────────────────────────────────────────────────────────────────

export function getStoredWallet(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(KEYS.wallet) : null;
}

export function setStoredWallet(address: string) {
  localStorage.setItem(KEYS.wallet, address);
}

// ── Datasets ──────────────────────────────────────────────────────────────────

export function getDatasets(wallet: string): Dataset[] {
  return read<Dataset[]>(KEYS.datasets(wallet), []);
}

export function addDataset(wallet: string, dataset: Dataset) {
  const existing = getDatasets(wallet);
  write(KEYS.datasets(wallet), [...existing, dataset]);
}

// ── Grants ────────────────────────────────────────────────────────────────────

export function getGrants(wallet: string): ConsentGrant[] {
  return read<ConsentGrant[]>(KEYS.grants(wallet), []);
}

export function addGrant(wallet: string, grant: ConsentGrant) {
  const existing = getGrants(wallet);
  write(KEYS.grants(wallet), [...existing, grant]);
}

export function revokeGrant(wallet: string, grantId: string) {
  const existing = getGrants(wallet);
  write(
    KEYS.grants(wallet),
    existing.map((g) => (g.id === grantId ? { ...g, revoked: true } : g))
  );
}

// ── Audit log ─────────────────────────────────────────────────────────────────

export function getAuditLog(wallet: string): AuditEvent[] {
  return read<AuditEvent[]>(KEYS.auditLog(wallet), []);
}

export function appendAuditEvent(wallet: string, event: Omit<AuditEvent, "id">) {
  const existing = getAuditLog(wallet);
  write(KEYS.auditLog(wallet), [
    { ...event, id: crypto.randomUUID() },
    ...existing,
  ]);
}
