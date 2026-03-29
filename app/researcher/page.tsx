"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Brain, FlaskConical, Lock, Unlock, LogIn, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "@/hooks/useTranslation";
import { getStoredWallet, setStoredWallet, getGrants, appendAuditEvent, type Dataset, getDatasets } from "@/lib/store";
import type { ConsentGrant } from "@/components/ConsentCard";

interface GrantWithDataset extends ConsentGrant {
  dataset?: Dataset;
  patientWallet: string;
  decryptedContent?: string;
  decryptError?: string;
}

/**
 * Simulate scanning all localStorage keys for grants where researcherAddress = current wallet.
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
  const [wallet, setWallet] = useState<string | null>(null);
  const [walletInput, setWalletInput] = useState("");
  const [grants, setGrants] = useState<GrantWithDataset[]>([]);
  const [decrypting, setDecrypting] = useState<Record<string, boolean>>({});

  const refresh = useCallback((w: string) => {
    setGrants(findGrantsForResearcher(w));
  }, []);

  useEffect(() => {
    const stored = getStoredWallet();
    if (stored) { setWallet(stored); refresh(stored); }
  }, [refresh]);

  function connect() {
    const addr = walletInput.trim() || `0xResearcher${Math.random().toString(16).slice(2, 8)}`;
    setStoredWallet(addr);
    setWallet(addr);
    refresh(addr);
  }

  async function handleDecrypt(grant: GrantWithDataset) {
    setDecrypting((d) => ({ ...d, [grant.id]: true }));

    // Simulate Lit Protocol decryption for demo
    await new Promise((r) => setTimeout(r, 1200));

    const isRevoked = grant.revoked || new Date(grant.expiresAt) < new Date();

    setGrants((prev) =>
      prev.map((g) =>
        g.id === grant.id
          ? {
              ...g,
              decryptedContent: isRevoked ? undefined : `[EEG Data] ${grant.dataset?.fileName ?? "dataset"}\nChannels: 64 | Duration: 120s | Sample rate: 256Hz\nPatient: anonymous | Study: ${grant.purpose}`,
              decryptError: isRevoked ? t("researcher_access_revoked") : undefined,
            }
          : g
      )
    );

    // Fire SMS notification and log access event
    if (!isRevoked && grant.dataset?.phoneNumber) {
      appendAuditEvent(grant.patientWallet, {
        type: "accessed",
        actor: wallet ?? "Researcher",
        timestamp: new Date().toLocaleString(),
        datasetCid: grant.datasetCid,
      });
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: grant.dataset.phoneNumber,
          researcherName: grant.researcherName,
        }),
      }).catch(() => {});
    }

    setDecrypting((d) => ({ ...d, [grant.id]: false }));
  }

  // ── Not connected ────────────────────────────────────────────────────────────
  if (!wallet) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <header className="flex items-center justify-between px-4 py-3 border-b bg-background">
          <Link href="/" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-semibold">{t("app_name")}</span>
          </Link>
          <LanguageToggle />
        </header>
        <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              {t("researcher_title")}
            </CardTitle>
            <CardDescription>{t("researcher_subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("researcher_wallet_label")}</Label>
              <Input
                placeholder={t("wallet_placeholder")}
                value={walletInput}
                onChange={(e) => setWalletInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && connect()}
              />
            </div>
            <Button className="w-full" onClick={connect}>
              <LogIn className="h-4 w-4" />
              {t("researcher_connect")}
            </Button>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  // ── Portal ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <Link href="/" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
          <Brain className="h-5 w-5 text-primary" />
          <span className="font-semibold">{t("app_name")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Button variant="ghost" size="sm" onClick={() => { setWallet(null); setWalletInput(""); }}>
            {wallet.slice(0, 10)}…
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-4">
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
