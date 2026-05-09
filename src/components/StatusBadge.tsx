import type { ApplicationStatus } from "@/types";
import { useLang } from "@/i18n/LanguageContext";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  submitted: "bg-slate-100 text-slate-800 border-slate-300",
  received: "bg-blue-100 text-blue-800 border-blue-300",
  processing: "bg-amber-100 text-amber-800 border-amber-300",
  ready: "bg-emerald-100 text-emerald-800 border-emerald-300",
  completed: "bg-green-100 text-green-800 border-green-300",
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
