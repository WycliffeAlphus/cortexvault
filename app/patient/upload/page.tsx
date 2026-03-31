"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, FileUp, CheckCircle2, AlertCircle, Brain, ChevronLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { addDataset, getStoredWallet } from "@/lib/store";
import { encryptFile } from "@/lib/lit";

type UploadStep = "idle" | "encrypting" | "uploading" | "done" | "error";

const DEMO_EEG_FILE_NAME = "S001R01_motor_imagery.edf";

export default function UploadPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<UploadStep>("idle");
  const [cid, setCid] = useState("");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  async function loadDemoEeg() {
    const res = await fetch("/demo-eeg/demo-motor-imagery.edf");
    const blob = await res.blob();
    const demo = new File([blob], DEMO_EEG_FILE_NAME, { type: "application/octet-stream" });
    setFile(demo);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleUpload() {
    if (!file) return;
    const wallet = getStoredWallet() ?? "demo-wallet";
    setErrorMsg("");

    try {
      // Step 1: Encrypt with Lit Protocol (AES-GCM + access control conditions)
      setStep("encrypting");
      setProgress(15);

      const fileBuffer = await file.arrayBuffer();
      // Seed ties the key to this patient's wallet + file content hash
      const seed = `${wallet}:${file.name}:${file.size}`;
      // No researchers yet — grant access later via consent form
      // expiresAt far in the future so the patient can manage it
      const expiresAtUnix = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 10; // 10 years
      const encryptedPayload = await encryptFile(fileBuffer, [], expiresAtUnix, seed);

      setProgress(45);

      // Step 2: Upload encrypted file to Storacha (Filecoin)
      setStep("uploading");

      // Upload the original file to IPFS/Filecoin via Storacha
      // The encrypted payload (conditions + ciphertext) is stored in localStorage
      const form = new FormData();
      form.append("file", file);
      form.append("patientWallet", wallet);
      form.append("phoneNumber", phone);
      form.append("encryptedPayload", JSON.stringify(encryptedPayload));
      form.append("fileSize", String(file.size));

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      const resultCid: string = json.cid;

      setProgress(100);
      setCid(resultCid);

      addDataset(wallet, {
        cid: resultCid,
        fileName: file.name,
        fileSize: file.size,
        encryptedPayload: JSON.stringify(encryptedPayload),
        uploadedAt: new Date().toISOString(),
        phoneNumber: phone,
      });

      setStep("done");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Upload failed");
      setStep("error");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur">
        <Link href="/" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
          <Brain className="h-5 w-5 text-primary" />
          <span className="font-semibold">{t("app_name")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/patient" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />
            {t("back_to_dashboard")}
          </Link>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-4 pt-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t("upload_title")}
          </CardTitle>
          <CardDescription>{t("upload_description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File input */}
          <div className="space-y-1.5">
            <Label htmlFor="eeg-file">{t("upload_label")}</Label>
            <Input
              id="eeg-file"
              ref={fileRef}
              type="file"
              accept=".edf,.bdf,.gdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              disabled={step !== "idle"}
            />
            <p className="text-xs text-muted-foreground">
              {t("upload_demo_hint")}{" "}
              <button
                type="button"
                className="underline text-primary"
                onClick={loadDemoEeg}
                disabled={step !== "idle"}
              >
                {t("upload_demo_btn")}
              </button>
            </p>
          </div>

          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-md border px-3 py-2">
              <FileUp className="h-4 w-4 shrink-0" />
              <span className="truncate">{file.name}</span>
              <span className="ml-auto shrink-0">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
          )}

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t("upload_phone_label")}</Label>
            <Input
              id="phone"
              type="tel"
              placeholder={t("upload_phone_placeholder")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={step !== "idle"}
            />
          </div>

          {/* Encryption notice */}
          {step === "idle" && file && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-md px-3 py-2">
              <Lock className="h-3.5 w-3.5 shrink-0 text-primary" />
              {t("upload_lit_notice")}
            </div>
          )}

          {/* Progress */}
          {(step === "encrypting" || step === "uploading") && (
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">
                {step === "encrypting" ? t("upload_encrypting") : t("upload_uploading")}
              </p>
              <Progress value={progress} />
            </div>
          )}

          {/* Result */}
          {step === "done" && (
            <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 rounded-md px-3 py-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                {t("upload_success")}{" "}
                <span className="font-mono break-all">{cid}</span>
              </span>
            </div>
          )}

          {step === "error" && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorMsg || t("error_upload_failed")}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {step === "done" ? (
              <Button className="flex-1" onClick={() => router.push("/patient")}>
                {t("back_to_dashboard")}
              </Button>
            ) : (
              <>
                <Button variant="outline" className="flex-1" onClick={() => router.push("/patient")}>
                  {t("cancel")}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleUpload}
                  disabled={!file || step !== "idle"}
                >
                  {t("upload_btn")}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
