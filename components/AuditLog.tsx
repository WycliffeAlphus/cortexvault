"use client";

import { Clock, Eye, UserCheck, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/useTranslation";

export type AuditEventType = "accessed" | "granted" | "revoked";

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  actor: string;
  timestamp: string;
  datasetCid?: string;
}

interface AuditLogProps {
  events: AuditEvent[];
}

const EVENT_CONFIG: Record<AuditEventType, { icon: React.FC<{ className?: string }>; color: string; badgeVariant: "default" | "success" | "destructive" | "outline" | "secondary" | "warning" }> = {
  accessed: { icon: Eye, color: "text-blue-600", badgeVariant: "default" },
  granted: { icon: UserCheck, color: "text-green-600", badgeVariant: "success" },
  revoked: { icon: UserX, color: "text-red-600", badgeVariant: "destructive" },
};

export function AuditLog({ events }: AuditLogProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          {t("audit_title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t("audit_empty")}</p>
        ) : (
          <ul className="space-y-3">
            {events.map((event) => {
              const { icon: Icon, color, badgeVariant } = EVENT_CONFIG[event.type];
              const label =
                event.type === "accessed"
                  ? `${event.actor} ${t("audit_event_accessed")}`
                  : event.type === "granted"
                  ? `${t("audit_event_granted")} ${event.actor}`
                  : `${t("audit_event_revoked")} ${event.actor}`;

              return (
                <li key={event.id} className="flex items-start gap-3 text-sm">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{label}</p>
                    {event.datasetCid && (
                      <p className="text-xs text-muted-foreground font-mono truncate">{event.datasetCid}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant={badgeVariant} className="text-xs">{event.type}</Badge>
                    <span className="text-xs text-muted-foreground">{event.timestamp}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
