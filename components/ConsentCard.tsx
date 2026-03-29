"use client";

import { useState } from "react";
import { UserCheck, UserX, CalendarDays, FlaskConical } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  const status = grant.revoked ? "revoked" : isExpired ? "revoked" : "active";

  return (
    <Card className={grant.revoked || isExpired ? "opacity-60" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold truncate">{grant.researcherName}</CardTitle>
          <Badge variant={status === "active" ? "success" : "destructive"} className="shrink-0">
            {status === "active" ? t("consent_active") : t("consent_revoked")}
          </Badge>
        </div>
        <p className="text-xs font-mono text-muted-foreground truncate">{grant.researcherAddress}</p>
      </CardHeader>
      <CardContent className="space-y-1.5 pb-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FlaskConical className="h-3 w-3 shrink-0" />
          <span className="truncate">{grant.purpose}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3 w-3 shrink-0" />
          <span>{t("consent_expires")}: {new Date(grant.expiresAt).toLocaleDateString()}</span>
        </div>
        <p className="text-xs font-mono text-muted-foreground truncate">CID: {grant.datasetCid}</p>
      </CardContent>
      {status === "active" && (
        <CardFooter className="pt-0">
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
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
