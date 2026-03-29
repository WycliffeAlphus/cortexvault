"use client";

import Link from "next/link";
import { Brain, Lock, Users, Smartphone, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useTranslation } from "@/hooks/useTranslation";

const FEATURE_ICONS = [Lock, Users, Smartphone] as const;

const TECH_LOGOS = [
  { src: "https://storacha.network/img/storacha-wm.svg", alt: "Storacha", h: 18 },
  { src: "https://filecoin.io/images/filecoin-logo.svg", alt: "Filecoin", h: 20 },
  { src: "https://www.litprotocol.com/lit-logo.svg", alt: "Lit Protocol", h: 18 },
  { src: "https://res.cloudinary.com/startup-grind/image/upload/dpr_2.0,fl_sanitize/v1/gcs/platform-data-africastalking/contentbuilder/at-community-logo-colored_UWdXHTK.svg", alt: "Africa's Talking", h: 22 },
] as const;

const ICON_COLORS = [
  "bg-indigo-100 text-indigo-600",
  "bg-violet-100 text-violet-600",
  "bg-cyan-100 text-cyan-600",
] as const;

export default function LandingPage() {
  const { t } = useTranslation();

  const features = [
    { icon: FEATURE_ICONS[0], iconColor: ICON_COLORS[0], title: t("feature_1_title"), desc: t("feature_1_desc") },
    { icon: FEATURE_ICONS[1], iconColor: ICON_COLORS[1], title: t("feature_2_title"), desc: t("feature_2_desc") },
    { icon: FEATURE_ICONS[2], iconColor: ICON_COLORS[2], title: t("feature_3_title"), desc: t("feature_3_desc") },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-5 py-3.5 border-b bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Brain className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <span className="font-bold text-base tracking-tight">{t("app_name")}</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="relative overflow-hidden px-4 pt-16 pb-20 text-center">
          {/* Dot grid background */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: "radial-gradient(oklch(0.585 0.233 277 / 0.15) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          {/* Radial glow */}
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.585 0.233 277 / 0.12) 0%, transparent 70%)",
            }}
          />

          <div className="relative max-w-2xl mx-auto space-y-8">
            {/* Tag */}
            <div className="inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
              <Shield className="h-3 w-3 text-primary" />
              Kenya Data Protection Act 2019 · Neural Data Rights
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl leading-tight">
                {t("landing_hero_title").split(",")[0]},
                <br />
                <span
                  style={{
                    background: "linear-gradient(135deg, oklch(0.585 0.233 277), oklch(0.77 0.133 195))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {t("landing_hero_title").split(",")[1]?.trim() ?? "Your Choice."}
                </span>
              </h1>
              <p className="text-muted-foreground leading-relaxed text-base max-w-lg mx-auto">
                {t("landing_hero_subtitle")}
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="gap-2 shadow-md">
                <Link href="/patient">
                  {t("landing_cta_patient")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link href="/researcher">{t("landing_cta_researcher")}</Link>
              </Button>
            </div>

            {/* Tech stack logos */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Built with</p>
              <div className="flex flex-wrap items-center justify-center gap-6">
                {TECH_LOGOS.map(({ src, alt, h }) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={alt}
                    src={src}
                    alt={alt}
                    style={{ height: h, width: "auto", opacity: 0.75, filter: "grayscale(20%)" }}
                    className="hover:opacity-100 hover:filter-none transition-all duration-200"
                    onError={(e) => {
                      // Fallback to text if image fails
                      const el = e.currentTarget;
                      el.style.display = "none";
                      const span = document.createElement("span");
                      span.textContent = alt;
                      span.className = "text-xs font-medium text-muted-foreground";
                      el.parentElement?.appendChild(span);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section className="px-4 pb-16">
          <div className="grid gap-4 max-w-2xl mx-auto sm:grid-cols-3">
            {features.map(({ icon: Icon, iconColor, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border bg-card p-5 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="text-center py-4 px-4 text-xs text-muted-foreground border-t">
        🇰🇪 {t("footer_compliance")}
      </footer>
    </div>
  );
}
