"use client";

import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/useTranslation";

export function EthicsPanel() {
  const { t } = useTranslation();

  const rights = [
    t("ethics_right_1"),
    t("ethics_right_2"),
    t("ethics_right_3"),
    t("ethics_right_4"),
  ] as const;

  return (
    <Card
      className="border-0 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, oklch(0.95 0.05 162 / 0.4), oklch(0.97 0.03 210 / 0.3))",
        borderLeft: "3px solid oklch(0.696 0.17 162)",
      }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-emerald-800">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
          </div>
          {t("ethics_title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-emerald-900 leading-relaxed">{t("ethics_body")}</p>
        <div>
          <p className="text-sm font-semibold text-emerald-800 mb-3">{t("ethics_rights_title")}</p>
          <ul className="space-y-2">
            {rights.map((right, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-sm text-emerald-800 leading-snug">{right}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-emerald-700 pt-1 border-t border-emerald-200">
          🇰🇪 Kenya Data Protection Act 2019 · PL Genesis Hackathon 2026
        </p>
      </CardContent>
    </Card>
  );
}
