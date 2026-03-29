"use client";

import { useContext } from "react";
import { LanguageContext } from "@/components/LanguageProvider";
import en from "@/locales/en.json";
import sw from "@/locales/sw.json";

const translations = { en, sw } as const;
type Lang = keyof typeof translations;
type TranslationKey = keyof typeof en;

export function useTranslation() {
  const { lang } = useContext(LanguageContext);
  const t = (key: TranslationKey): string => translations[lang as Lang][key] ?? key;
  return { t, lang };
}
