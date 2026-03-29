"use client";

import { ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-green-800 text-base">
          <ShieldCheck className="h-5 w-5" />
          {t("ethics_title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-green-700 leading-relaxed">{t("ethics_body")}</p>
        <Separator className="bg-green-200" />
        <div>
          <p className="text-sm font-semibold text-green-800 mb-2">{t("ethics_rights_title")}</p>
          <ul className="space-y-1">
            {rights.map((right, i) => (
              <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                {right}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
