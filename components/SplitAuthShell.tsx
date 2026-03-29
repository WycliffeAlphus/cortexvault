"use client";

import Link from "next/link";
import { Brain, Lock, Users, Smartphone, FlaskConical, ShieldCheck, Eye, ChevronLeft } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslation } from "@/hooks/useTranslation";

type Role = "patient" | "researcher";

interface SplitAuthShellProps {
  role: Role;
  children: React.ReactNode;
}

export function SplitAuthShell({ role, children }: SplitAuthShellProps) {
  const { t } = useTranslation();
  const isPatient = role === "patient";

  const gradientClass = isPatient
    ? "from-indigo-950 via-violet-950 to-zinc-950"
    : "from-zinc-950 via-cyan-950 to-indigo-950";

  const blobA = isPatient ? "bg-violet-600/25" : "bg-cyan-500/20";
  const blobB = isPatient ? "bg-indigo-500/15" : "bg-indigo-600/20";
  const accentLine = isPatient ? "border-violet-500" : "border-cyan-500";
  const accentText = isPatient ? "text-violet-400" : "text-cyan-400";
  const iconBg = isPatient ? "bg-violet-500/20 text-violet-300" : "bg-cyan-500/20 text-cyan-300";

  const headline = t(isPatient ? "patient_login_headline" : "researcher_login_headline");
  const tagline  = t(isPatient ? "patient_login_tagline"  : "researcher_login_tagline");

  const features = isPatient
    ? [
        { icon: Lock,        text: t("patient_feature_1") },
        { icon: Users,       text: t("patient_feature_2") },
        { icon: Smartphone,  text: t("patient_feature_3") },
        { icon: ShieldCheck, text: t("patient_feature_4") },
      ]
    : [
        { icon: FlaskConical, text: t("researcher_feature_1") },
        { icon: Eye,          text: t("researcher_feature_2") },
        { icon: ShieldCheck,  text: t("researcher_feature_3") },
        { icon: Lock,         text: t("researcher_feature_4") },
      ];

  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* ── Left panel (always dark) ─────────────────────────────────────── */}
      <div className={`relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br ${gradientClass}`}>

        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
          }}
        />

        {/* Blob glows */}
        <div className={`absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl pointer-events-none ${blobA}`} />
        <div className={`absolute -bottom-24 -right-16 w-80 h-80 rounded-full blur-3xl pointer-events-none ${blobB}`} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="text-white font-semibold text-base">{t("app_name")}</span>
        </div>

        {/* Main content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-white leading-snug mb-3">{headline}</h1>
            <p className="text-white/60 text-base leading-relaxed max-w-sm">{tagline}</p>
          </div>
          <ul className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-white/75 text-sm leading-snug pt-1.5">{text}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className={`relative z-10 border-l-2 pl-4 ${accentLine}`}>
          <p className={`text-xs font-medium ${accentText}`}>🇰🇪 {t("split_compliance")}</p>
          <p className="text-white/40 text-xs mt-0.5">{t("split_hackathon")}</p>
        </div>
      </div>

      {/* ── Right panel (respects theme) ─────────────────────────────────── */}
      <div className="flex flex-col min-h-screen bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b lg:border-0">
          <Link href="/" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
              <Brain className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">{t("app_name")}</span>
          </Link>
          <div className="flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm space-y-8">
            {children}
          </div>
          <Link
            href="/"
            className="mt-10 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {t("back_to_home")}
          </Link>
        </div>
      </div>
    </div>
  );
}
