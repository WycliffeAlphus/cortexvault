"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Brain, FlaskConical, Lock, Unlock, LogIn, CalendarDays, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SplitAuthShell } from "@/components/SplitAuthShell";
import { useTranslation } from "@/hooks/useTranslation";
import { useWallet } from "@/hooks/useWallet";
import { appendAuditEvent, type Dataset, getDatasets } from "@/lib/store";
import { decryptFile } from "@/lib/lit";
import type { ConsentGrant } from "@/components/ConsentCard";

interface GrantWithDataset extends ConsentGrant {
  dataset?: Dataset;
  patientWallet: string;
  decryptedContent?: string;
  decryptError?: string;
}

/**
 * Scan all localStorage keys for grants where researcherAddress = current wallet.
 * In production this would be a backend query or on-chain event scan.
 */
function findGrantsForResearcher(researcherWallet: string): GrantWithDataset[] {
  if (typeof window === "undefined") return [];
  const results: GrantWithDataset[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith("nv:grants:")) continue;
    const patientWallet = key.replace("nv:grants:", "");
    try {
      const grants: ConsentGrant[] = JSON.parse(localStorage.getItem(key) ?? "[]");
      const datasets = getDatasets(patientWallet);
      for (const grant of grants) {
        if (grant.researcherAddress.toLowerCase() === researcherWallet.toLowerCase()) {
          const dataset = datasets.find((d) => d.cid === grant.datasetCid);
          results.push({ ...grant, dataset, patientWallet });
        }
      }
    } catch { /* skip corrupted keys */ }
  }
  return results;
}

export default function ResearcherPortal() {
  const { t } = useTranslation();
  const { wallet, connect, disconnect, connecting } = useWallet();
  const [walletInput, setWalletInput] = useState("");
  const [grants, setGrants] = useState<GrantWithDataset[]>([]);
  const [decrypting, setDecrypting] = useState<Record<string, boolean>>({});

  const hasMetaMask = typeof window !== "undefined" && !!(window as Window & { ethereum?: unknown }).ethereum;

  const refresh = useCallback((w: string) => {
    setGrants(findGrantsForResearcher(w));
  }, []);

  useEffect(() => {
    if (wallet) refresh(wallet);
  }, [wallet, refresh]);

  async function handleConnect() {
    const addr = await connect(walletInput);
    if (addr) refresh(addr);
  }

  async function handleDecrypt(grant: GrantWithDataset) {
    if (!wallet) return;
    setDecrypting((d) => ({ ...d, [grant.id]: true }));

    const isRevoked = grant.revoked || new Date(grant.expiresAt) < new Date();

    if (isRevoked) {
      setGrants((prev) =>
        prev.map((g) =>
          g.id === grant.id ? { ...g, decryptError: t("researcher_access_revoked") } : g
        )
      );
      setDecrypting((d) => ({ ...d, [grant.id]: false }));
      return;
    }

    try {
      let decryptedContent: string;

      if (grant.dataset?.encryptedPayload) {
        const payload = JSON.parse(grant.dataset.encryptedPayload);

        // Check if this is a real encrypted payload (has ciphertext + wrappedKey)
        if (payload.ciphertext && payload.wrappedKey) {
          // Real Lit Protocol decryption — verify access conditions and decrypt
          const expiresAtUnix = Math.floor(new Date(grant.expiresAt).getTime() / 1000);

          // Re-build the correct access conditions to verify
          const conditionCheck = payload.accessControlConditions as { returnValueTest?: { comparator: string; value: string } }[];
          const addrInConditions = conditionCheck.some(
            (c) => c.returnValueTest?.comparator === "=" &&
              c.returnValueTest.value.toLowerCase() === wallet.toLowerCase()
          );

          if (!addrInConditions && conditionCheck.length > 0) {
            throw new Error(t("researcher_access_revoked"));
          }
          if (Math.floor(Date.now() / 1000) > expiresAtUnix) {
            throw new Error(t("researcher_access_revoked"));
          }

          // Attempt decrypt — shows real decryption working
          try {
            const buf = await decryptFile(payload, wallet, `${grant.patientWallet}:${grant.dataset.fileName}:${grant.dataset.cid.length}`);
            const byteCount = buf.byteLength;
            decryptedContent = `[${t("eeg_decrypted_label")}]\nFile: ${grant.dataset.fileName}\nSize: ${(byteCount / 1024).toFixed(1)} KB\nCID: ${grant.datasetCid}\n${t("eeg_study_label")} ${grant.purpose}\n${t("eeg_access_until")} ${new Date(grant.expiresAt).toLocaleDateString()}`;
          } catch {
            // Seed mismatch (different browser session) — show metadata only
            decryptedContent = `[${t("eeg_lit_verified_label")}]\nFile: ${grant.dataset.fileName}\n${t("eeg_channels_info")}\nCID: ${grant.datasetCid}\n${t("eeg_study_label")} ${grant.purpose}\n${t("eeg_access_until")} ${new Date(grant.expiresAt).toLocaleDateString()}`;
          }
        } else {
          // Legacy demo payload
          decryptedContent = `[${t("eeg_data_label")}] ${grant.dataset.fileName}\n${t("eeg_channels_info")}\n${t("eeg_patient_anon")} | ${t("eeg_study_label")} ${grant.purpose}`;
        }
      } else {
        decryptedContent = `[${t("eeg_data_label")}] ${grant.datasetCid.slice(0, 20)}…\n${t("eeg_channels_info")}\n${t("eeg_study_label")} ${grant.purpose}`;
      }

      setGrants((prev) =>
        prev.map((g) => g.id === grant.id ? { ...g, decryptedContent } : g)
      );

      // Log access event and fire SMS notification
      appendAuditEvent(grant.patientWallet, {
        type: "accessed",
        actor: wallet,
        timestamp: new Date().toLocaleString(),
        datasetCid: grant.datasetCid,
      });

      if (grant.dataset?.phoneNumber) {
        fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: grant.dataset.phoneNumber,
            researcherName: grant.researcherName,
          }),
        }).catch(() => {});
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("researcher_access_revoked");
      setGrants((prev) =>
        prev.map((g) => g.id === grant.id ? { ...g, decryptError: msg } : g)
      );
    }

    setDecrypting((d) => ({ ...d, [grant.id]: false }));
  }

  // ── Not connected ────────────────────────────────────────────────────────────
  if (!wallet) {
    return (
      <SplitAuthShell role="researcher">
        <div>
          <h2 className="text-2xl font-bold mb-1">{t("researcher_title")}</h2>
          <p className="text-muted-foreground text-sm mb-8">{t("researcher_subtitle")}</p>

          <div className="space-y-3">
            {hasMetaMask ? (
              <Button className="w-full h-11 text-sm font-medium" onClick={() => handleConnect()} disabled={connecting}>
                <Wallet className="h-4 w-4" />
                {connecting ? t("wallet_connecting") : t("connect_metamask")}
              </Button>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {t("researcher_wallet_label")}
                  </Label>
                  <Input
                    className="h-11"
                    placeholder={t("wallet_placeholder")}
                    value={walletInput}
                    onChange={(e) => setWalletInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                  />
                </div>
                <Button className="w-full h-11 text-sm font-medium" onClick={() => handleConnect()} disabled={connecting}>
                  <LogIn className="h-4 w-4" />
                  {connecting ? t("wallet_connecting") : t("researcher_connect")}
                </Button>
              </>
            )}
          </div>
        </div>
      </SplitAuthShell>
    );
  }

  // ── Portal ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur">
        <Link href="/" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
          <Brain className="h-5 w-5 text-primary" />
          <span className="font-semibold">{t("app_name")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1"><LanguageToggle /><ThemeToggle /></div>
          <Button variant="ghost" size="sm" onClick={disconnect}>
            {wallet.slice(0, 10)}…
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 pt-16 space-y-4">
        <div>
          <h1 className="text-xl font-bold">{t("researcher_title")}</h1>
          <p className="text-sm text-muted-foreground">{t("researcher_subtitle")}</p>
        </div>

        {grants.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">{t("researcher_no_datasets")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("researcher_grant_hint")} <span className="font-mono">{wallet}</span>
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {grants.map((grant) => {
              const isRevoked = grant.revoked || new Date(grant.expiresAt) < new Date();
              return (
                <Card key={grant.id} className={isRevoked ? "opacity-60" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-semibold">
                        {grant.dataset?.fileName ?? grant.datasetCid.slice(0, 20) + "…"}
                      </CardTitle>
                      <Badge variant={isRevoked ? "destructive" : "success"} className="shrink-0">
                        {isRevoked ? t("consent_revoked") : t("consent_active")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1.5 pb-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <FlaskConical className="h-3 w-3 shrink-0" />
                      <span>{t("researcher_purpose_label")}: {grant.purpose}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3 w-3 shrink-0" />
                      <span>{t("researcher_expires_label")}: {new Date(grant.expiresAt).toLocaleDateString()}</span>
                    </div>
                    <p className="font-mono truncate">CID: {grant.datasetCid}</p>

                    {/* Decrypted content view */}
                    {grant.decryptedContent && (
                      <div className="mt-2 rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap">
                        {grant.decryptedContent}
                      </div>
                    )}
                    {grant.decryptError && (
                      <div className="mt-2 rounded-md bg-destructive/10 text-destructive px-3 py-2 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 shrink-0" />
                        {grant.decryptError}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button
                      size="sm"
                      variant={isRevoked ? "outline" : "default"}
                      className="w-full"
                      onClick={() => handleDecrypt(grant)}
                      disabled={decrypting[grant.id] || !!grant.decryptedContent || !!grant.decryptError}
                    >
                      {decrypting[grant.id] ? (
                        t("researcher_decrypting")
                      ) : grant.decryptedContent ? (
                        <><Unlock className="h-4 w-4" /> {t("decrypted")}</>
                      ) : (
                        <><Unlock className="h-4 w-4" /> {t("researcher_decrypt_btn")}</>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
