"use client";

import { useState } from "react";
import { UserX, CalendarDays, FlaskConical } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

export interface ConsentGrant {
  id: string;
  datasetCid: string;
  researcherAddress: string;
  researcherName: string;
  purpose: string;
  expiresAt: string;
  revoked: boolean;
}

interface ConsentCardProps {
  grant: ConsentGrant;
  onRevoke: (grantId: string) => Promise<void>;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-violet-100 text-violet-700",
  "bg-cyan-100 text-cyan-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
];

function avatarColor(str: string): string {
  let hash = 0;
  for (const ch of str) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function ConsentCard({ grant, onRevoke }: ConsentCardProps) {
  const { t } = useTranslation();
  const [revoking, setRevoking] = useState(false);

  async function handleRevoke() {
    setRevoking(true);
    try {
      await onRevoke(grant.id);
    } finally {
      setRevoking(false);
    }
  }

  const isExpired = !grant.revoked && new Date(grant.expiresAt) < new Date();
  const isActive = !grant.revoked && !isExpired;
  const colorClass = avatarColor(grant.researcherName || grant.researcherAddress);

  // Days remaining
  const daysLeft = Math.ceil((new Date(grant.expiresAt).getTime() - Date.now()) / 86_400_000);

  return (
    <Card className={`transition-opacity ${isActive ? "" : "opacity-55"}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${colorClass}`}>
            {initials(grant.researcherName) || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{grant.researcherName || t("consent_unnamed_researcher")}</p>
            <p className="text-xs font-mono text-muted-foreground truncate">{grant.researcherAddress}</p>
          </div>
          {/* Status indicator */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`h-2 w-2 rounded-full ${
                isActive ? "bg-emerald-500 animate-pulse" : "bg-red-400"
              }`}
            />
            <span className={`text-xs font-medium ${isActive ? "text-emerald-700" : "text-red-600"}`}>
              {isActive ? t("consent_active") : t("consent_revoked")}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pb-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FlaskConical className="h-3 w-3 shrink-0" />
          <span className="truncate">{grant.purpose}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3 shrink-0" />
            <span>{t("consent_expires")}: {new Date(grant.expiresAt).toLocaleDateString()}</span>
          </div>
          {isActive && daysLeft > 0 && (
            <span className={`font-medium ${daysLeft <= 7 ? "text-amber-600" : "text-muted-foreground"}`}>
              {daysLeft} {t("days_left")}
            </span>
          )}
        </div>
        <p className="text-xs font-mono text-muted-foreground truncate">CID: {grant.datasetCid}</p>
      </CardContent>

      {isActive && (
        <CardFooter className="pt-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
            onClick={handleRevoke}
            disabled={revoking}
          >
            <UserX className="h-4 w-4" />
            {revoking ? "..." : t("consent_revoke_btn")}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
