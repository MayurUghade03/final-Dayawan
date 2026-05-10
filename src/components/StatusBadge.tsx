import type { ApplicationStatus } from "@/types";
import { useLang } from "@/i18n/LanguageContext";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  submitted: "bg-muted text-muted-foreground border-border",
  received: "bg-info/15 text-info border-info/35",
  processing: "bg-warning/20 text-warning border-warning/35",
  ready: "bg-success/20 text-success border-success/35",
  completed: "bg-success/25 text-success border-success/40",
};

const STATUS_LABEL_KEYS: Record<
  ApplicationStatus,
  "status_submitted" | "status_received" | "status_processing" | "status_ready" | "status_completed"
> = {
  submitted: "status_submitted",
  received: "status_received",
  processing: "status_processing",
  ready: "status_ready",
  completed: "status_completed",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const { t } = useLang();
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {t(STATUS_LABEL_KEYS[status])}
    </span>
  );
}
