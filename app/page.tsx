"use client";

import Link from "next/link";
import { Brain, Lock, Users, Smartphone, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslation } from "@/hooks/useTranslation";

const FEATURE_ICONS = [Lock, Users, Smartphone] as const;

const TECH_LOGOS = [
  { src: "https://storacha.network/img/storacha-wm.svg", alt: "Storacha", h: 18, darkInvert: false },
  { src: "https://filecoin.io/images/filecoin-logo.svg", alt: "Filecoin", h: 20, darkInvert: false },
  { src: "https://www.litprotocol.com/lit-logo.svg", alt: "Lit Protocol", h: 18, darkInvert: true },
  { src: "https://res.cloudinary.com/startup-grind/image/upload/dpr_2.0,fl_sanitize/v1/gcs/platform-data-africastalking/contentbuilder/at-community-logo-colored_UWdXHTK.svg", alt: "Africa's Talking", h: 22, darkInvert: false },
] as const;

const ICON_COLORS = [
  "bg-indigo-500/20 text-indigo-300",
  "bg-violet-500/20 text-violet-300",
  "bg-cyan-500/20 text-cyan-300",
] as const;

export default function LandingPage() {
  const { t } = useTranslation();

  const features = [
    { icon: FEATURE_ICONS[0], iconColor: ICON_COLORS[0], title: t("feature_1_title"), desc: t("feature_1_desc") },
    { icon: FEATURE_ICONS[1], iconColor: ICON_COLORS[1], title: t("feature_2_title"), desc: t("feature_2_desc") },
    { icon: FEATURE_ICONS[2], iconColor: ICON_COLORS[2], title: t("feature_3_title"), desc: t("feature_3_desc") },
  ];

  const [line1, line2] = t("landing_hero_title").split(",").map((s) => s.trim());

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Hero (always dark) ───────────────────────────────────────────── */}
      <div className="relative bg-zinc-950 text-white overflow-hidden">

        {/* Nav */}
        <header className="relative z-20 flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-base">{t("app_name")}</span>
          </div>
          <div className="flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        {/* Background layers */}
        {/* Blob glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Dot grid with radial fade */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%)",
          }}
        />

        {/* Hero content */}
        <section className="relative z-10 flex flex-col items-center text-center px-4 pt-16 pb-24 gap-8">

          {/* Tag */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/60 backdrop-blur">
            <Shield className="h-3 w-3 text-violet-400" />
            Neural Data Rights · Kenya 2026
          </div>

          {/* Headline */}
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
              {line1},
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #a78bfa, #67e8f9)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {line2 ?? "Your Choice."}
              </span>
            </h1>
            <p className="text-white/55 text-lg leading-relaxed max-w-lg mx-auto">
              {t("landing_hero_subtitle")}
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="gap-2 bg-white text-zinc-900 hover:bg-zinc-100 rounded-lg font-semibold shadow-lg">
              <Link href="/patient">
                {t("landing_cta_patient")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10 rounded-lg">
              <Link href="/researcher">{t("landing_cta_researcher")}</Link>
            </Button>
          </div>

          {/* Tech logos */}
          <div className="flex flex-col items-center gap-3 pt-4">
            <p className="text-xs text-white/30 uppercase tracking-widest font-medium">Built with</p>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {TECH_LOGOS.map(({ src, alt, h, darkInvert }) => (
                <div key={alt} className="group flex flex-col items-center gap-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={alt}
                    style={{ height: h, width: "auto" }}
                    className={[
                      "opacity-40 grayscale transition-all duration-200",
                      "group-hover:opacity-100 group-hover:grayscale-0",
                      darkInvert ? "invert" : "",
                    ].join(" ")}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                  <span className="text-xs font-medium text-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap">
                    {alt}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── Feature cards (light / respects theme) ───────────────────────── */}
      <section className="flex-1 px-4 py-14 bg-background">
        <div className="grid gap-5 max-w-2xl mx-auto sm:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow space-y-3"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-4 px-4 text-xs text-muted-foreground border-t bg-background">
        🇰🇪 {t("footer_compliance")}
      </footer>
    </div>
  );
}
