"use client";

import { Clock, Eye, UserCheck, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const EVENT_CONFIG: Record<
  AuditEventType,
  { icon: React.FC<{ className?: string }>; dot: string; bg: string; text: string }
> = {
  accessed: {
    icon: Eye,
    dot: "bg-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  granted: {
    icon: UserCheck,
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  revoked: {
    icon: UserX,
    dot: "bg-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
  },
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
          <p className="text-sm text-muted-foreground text-center py-6">{t("audit_empty")}</p>
        ) : (
          <ol className="relative space-y-0">
            {events.map((event, idx) => {
              const { icon: Icon, dot, bg, text } = EVENT_CONFIG[event.type];
              const label =
                event.type === "accessed"
                  ? `${event.actor} ${t("audit_event_accessed")}`
                  : event.type === "granted"
                  ? `${t("audit_event_granted")} ${event.actor}`
                  : `${t("audit_event_revoked")} ${event.actor}`;

              const isLast = idx === events.length - 1;

              return (
                <li key={event.id} className="flex gap-3 pb-4">
                  {/* Timeline column */}
                  <div className="flex flex-col items-center">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                      <Icon className={`h-3 w-3 ${text}`} />
                    </div>
                    {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug">{label}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{event.timestamp}</span>
                      </div>
                    </div>
                    {event.datasetCid && (
                      <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{event.datasetCid}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
