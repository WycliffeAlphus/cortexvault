"use client";

import { useContext } from "react";
import { LanguageContext } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useContext(LanguageContext);
  const { t } = useTranslation();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLang(lang === "en" ? "sw" : "en")}
      className={`font-medium ${className ?? ""}`}
    >
      {t("lang_toggle")}
    </Button>
  );
}
