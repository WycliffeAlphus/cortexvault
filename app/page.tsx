"use client";

import Link from "next/link";
import { Brain, Lock, Smartphone, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "@/hooks/useTranslation";

const FEATURE_ICONS = [Lock, Users, Smartphone] as const;

export default function LandingPage() {
  const { t } = useTranslation();

  const features = [
    { icon: FEATURE_ICONS[0], title: t("feature_1_title"), desc: t("feature_1_desc") },
    { icon: FEATURE_ICONS[1], title: t("feature_2_title"), desc: t("feature_2_desc") },
    { icon: FEATURE_ICONS[2], title: t("feature_3_title"), desc: t("feature_3_desc") },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <header className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">{t("app_name")}</span>
        </div>
        <LanguageToggle />
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center gap-6">
        <div className="space-y-3 max-w-lg">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("landing_hero_title")}</h1>
          <p className="text-muted-foreground leading-relaxed">{t("landing_hero_subtitle")}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Button asChild className="flex-1" size="lg">
            <Link href="/patient">{t("landing_cta_patient")}</Link>
          </Button>
          <Button asChild variant="outline" className="flex-1" size="lg">
            <Link href="/researcher">{t("landing_cta_researcher")}</Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">{t("landing_powered_by")}</p>

        {/* Feature cards */}
        <div className="grid gap-4 w-full max-w-2xl sm:grid-cols-3 mt-4">
          {features.map(({ icon: Icon, title, desc }) => (
            <Card key={title}>
              <CardContent className="pt-5 flex flex-col items-center text-center gap-2">
                <Icon className="h-7 w-7 text-primary" />
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-muted-foreground border-t">
        {t("footer_compliance")}
      </footer>
    </div>
  );
}
