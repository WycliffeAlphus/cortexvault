"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Brain, Plus, LogIn, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConsentCard, type ConsentGrant } from "@/components/ConsentCard";
import { AuditLog, type AuditEvent } from "@/components/AuditLog";
import { EthicsPanel } from "@/components/EthicsPanel";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SplitAuthShell, PATIENT_FEATURES } from "@/components/SplitAuthShell";
import { useTranslation } from "@/hooks/useTranslation";
import { useWallet } from "@/hooks/useWallet";
import {
  getDatasets, getGrants, addGrant, revokeGrant, getAuditLog, appendAuditEvent, type Dataset,
} from "@/lib/store";

export default function PatientDashboard() {
  const { t } = useTranslation();
  const { wallet, connect, disconnect, connecting } = useWallet();
  const [walletInput, setWalletInput] = useState("");
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [grants, setGrants] = useState<ConsentGrant[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEvent[]>([]);

  // Grant form state
  const [selectedCid, setSelectedCid] = useState("");
  const [researcherAddr, setResearcherAddr] = useState("");
  const [researcherName, setResearcherName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [granting, setGranting] = useState(false);

  const hasMetaMask = typeof window !== "undefined" && !!(window as Window & { ethereum?: unknown }).ethereum;

  const refresh = useCallback((w: string) => {
    setDatasets(getDatasets(w));
    setGrants(getGrants(w));
    setAuditLog(getAuditLog(w));
  }, []);

  useEffect(() => {
    if (wallet) refresh(wallet);
  }, [wallet, refresh]);

  async function handleConnect() {
    const addr = await connect(walletInput);
    if (addr) refresh(addr);
  }

  async function handleGrant() {
    if (!wallet || !selectedCid || !researcherAddr || !expiresAt) return;
    setGranting(true);
    try {
      const res = await fetch("/api/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cid: selectedCid, researcherAddress: researcherAddr, researcherName, purpose, expiresAt }),
      });
      const { grant } = await res.json();
      addGrant(wallet, grant);
      appendAuditEvent(wallet, {
        type: "granted",
        actor: researcherName || researcherAddr,
        timestamp: new Date().toLocaleString(),
        datasetCid: selectedCid,
      });
      setResearcherAddr(""); setResearcherName(""); setPurpose(""); setExpiresAt(""); setSelectedCid("");
      refresh(wallet);
    } finally {
      setGranting(false);
    }
  }

  async function handleRevoke(grantId: string) {
    if (!wallet) return;
    await fetch("/api/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grantId }),
    });
    const grant = grants.find((g) => g.id === grantId);
    revokeGrant(wallet, grantId);
    if (grant) {
      appendAuditEvent(wallet, {
        type: "revoked",
        actor: grant.researcherName || grant.researcherAddress,
        timestamp: new Date().toLocaleString(),
        datasetCid: grant.datasetCid,
      });
    }
    refresh(wallet);
  }

  // ── Not connected ────────────────────────────────────────────────────────────
  if (!wallet) {
    return (
      <SplitAuthShell
        role="patient"
        headline="Your brain data. Your rules."
        tagline="Encrypt and store your EEG data on Filecoin. Grant researchers access. Revoke it anytime."
        features={PATIENT_FEATURES}
      >
        <div>
          <h2 className="text-2xl font-bold mb-1">{t("patient_dashboard_title")}</h2>
          <p className="text-muted-foreground text-sm mb-8">{t("connect_hint")}</p>

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

  // ── Dashboard ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <Link href="/" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
          <Brain className="h-5 w-5 text-primary" />
          <span className="font-semibold">{t("app_name")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1"><LanguageToggle /><ThemeToggle /></div>
          <Button variant="ghost" size="sm" onClick={disconnect}>
            {wallet.slice(0, 8)}…
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{t("patient_dashboard_title")}</h1>
            <p className="text-sm text-muted-foreground">{t("patient_dashboard_subtitle")}</p>
          </div>
          <Button asChild size="sm">
            <Link href="/patient/upload">
              <Plus className="h-4 w-4" />
              {t("patient_upload_tab")}
            </Link>
          </Button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: datasets.length, label: "Datasets" },
            { value: grants.filter((g) => !g.revoked && new Date(g.expiresAt) >= new Date()).length, label: "Active grants" },
            { value: auditLog.length, label: "Access events" },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-xl border bg-card px-4 py-3 text-center shadow-sm">
              <p className="text-2xl font-bold tabular-nums" style={{ color: "oklch(0.585 0.233 277)" }}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="consents">
          <TabsList className="w-full">
            <TabsTrigger value="consents" className="flex-1">{t("patient_consents_tab")}</TabsTrigger>
            <TabsTrigger value="audit" className="flex-1">{t("patient_audit_tab")}</TabsTrigger>
            <TabsTrigger value="ethics" className="flex-1">{t("ethics_tab")}</TabsTrigger>
          </TabsList>

          {/* ── Consents tab ── */}
          <TabsContent value="consents" className="space-y-4">
            {/* Grant form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("consent_grant_title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {datasets.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("consent_no_data")}</p>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label>{t("dataset_label")}</Label>
                      <Select value={selectedCid} onValueChange={setSelectedCid}>
                        <SelectTrigger>
                          <SelectValue placeholder={t("dataset_placeholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {datasets.map((d) => (
                            <SelectItem key={d.cid} value={d.cid}>
                              {d.fileName} — {d.cid.slice(0, 12)}…
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("consent_researcher_label")}</Label>
                      <Input placeholder={t("consent_researcher_placeholder")} value={researcherAddr} onChange={(e) => setResearcherAddr(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("consent_name_label")}</Label>
                      <Input placeholder={t("researcher_name_placeholder")} value={researcherName} onChange={(e) => setResearcherName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("consent_purpose_label")}</Label>
                      <Input placeholder={t("purpose_placeholder")} value={purpose} onChange={(e) => setPurpose(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("consent_expiry_label")}</Label>
                      <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                    </div>
                    <Button className="w-full" onClick={handleGrant} disabled={granting || !selectedCid || !researcherAddr || !expiresAt}>
                      {granting ? "..." : t("consent_grant_btn")}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Active grants */}
            {grants.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">{t("consent_no_grants")}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {grants.map((grant) => (
                  <ConsentCard key={grant.id} grant={grant} onRevoke={handleRevoke} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Audit log tab ── */}
          <TabsContent value="audit">
            <AuditLog events={auditLog} />
          </TabsContent>

          {/* ── Ethics tab ── */}
          <TabsContent value="ethics">
            <EthicsPanel />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
