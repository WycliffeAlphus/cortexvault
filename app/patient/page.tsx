"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Brain, Plus, LogIn } from "lucide-react";
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
import { useTranslation } from "@/hooks/useTranslation";
import {
  getStoredWallet, setStoredWallet, getDatasets, getGrants,
  addGrant, revokeGrant, getAuditLog, appendAuditEvent, type Dataset,
} from "@/lib/store";

export default function PatientDashboard() {
  const { t } = useTranslation();
  const [wallet, setWallet] = useState<string | null>(null);
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

  const refresh = useCallback((w: string) => {
    setDatasets(getDatasets(w));
    setGrants(getGrants(w));
    setAuditLog(getAuditLog(w));
  }, []);

  useEffect(() => {
    const stored = getStoredWallet();
    if (stored) {
      setWallet(stored);
      refresh(stored);
    }
  }, [refresh]);

  function connect() {
    const addr = walletInput.trim() || `0xDemo${Math.random().toString(16).slice(2, 10)}`;
    setStoredWallet(addr);
    setWallet(addr);
    refresh(addr);
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
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {t("patient_dashboard_title")}
            </CardTitle>
            <CardDescription>{t("connect_hint")}</CardDescription>
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
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <span className="font-semibold">{t("app_name")}</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Button variant="ghost" size="sm" onClick={() => { setWallet(null); setWalletInput(""); }}>
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
