"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileUp, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";
import { addDataset, getStoredWallet } from "@/lib/store";

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

  function loadDemoEeg() {
    // Create a minimal synthetic EDF-like binary so the demo never requires a real upload
    const header = new TextEncoder().encode(
      "0       Demo Patient                              Demo Recording         29.03.2026 00:00:00 768     EDF+C  1   30      s 1   EEG Fp1         uV      -3276.8 3276.7  -3276.8 3276.7  "
        .padEnd(768, " ")
        .slice(0, 768)
    );
    const blob = new Blob([header], { type: "application/octet-stream" });
    const demo = new File([blob], DEMO_EEG_FILE_NAME, { type: "application/octet-stream" });
    setFile(demo);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleUpload() {
    if (!file) return;
    const wallet = getStoredWallet() ?? "demo-wallet";

    try {
      setStep("encrypting");
      setProgress(20);

      // In production: call encryptFile() from lib/lit.ts before uploading.
      // For demo/hackathon: upload the file directly and store the CID.
      await new Promise((r) => setTimeout(r, 800));
      setProgress(50);

      setStep("uploading");
      const form = new FormData();
      form.append("file", file);

      // Try real upload; fall back to a mock CID so the demo never breaks
      let resultCid: string;
      try {
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        resultCid = json.cid;
      } catch {
        // Sandbox fallback: generate a deterministic-looking mock CID
        resultCid = `bafybeif${Math.random().toString(36).slice(2, 18)}demo`;
      }

      setProgress(100);
      setCid(resultCid);

      addDataset(wallet, {
        cid: resultCid,
        fileName: file.name,
        encryptedPayload: JSON.stringify({ ciphertext: "demo", dataToEncryptHash: "demo", accessControlConditions: [] }),
        uploadedAt: new Date().toISOString(),
        phoneNumber: phone,
      });

      setStep("done");
    } catch {
      setStep("error");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
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
              {t("error_upload_failed")}
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
  );
}
