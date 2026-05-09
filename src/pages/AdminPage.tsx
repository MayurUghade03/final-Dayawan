import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { STATUS_FLOW, useApplications } from "@/contexts/ApplicationContext";
import { Navigate } from "react-router-dom";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import type { ApplicationStatus } from "@/types";

const STATUS_LABEL_KEYS: Record<ApplicationStatus, "status_submitted" | "status_received" | "status_processing" | "status_ready" | "status_completed"> = {
  submitted: "status_submitted",
  received: "status_received",
  processing: "status_processing",
  ready: "status_ready",
  completed: "status_completed",
};

const AdminPage = () => {
  const { t } = useLang();
  const { status, isAdmin } = useAuth();
  const { applications, updateApplicationStatus } = useApplications();

  if (status === "unauthenticated") return <Navigate to="/login" replace state={{ from: "/admin" }} />;
  if (status === "loading") return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="hero-bg border-b border-border">
          <div className="container-rural py-12 sm:py-16">
            <div className="heading-eyebrow mb-3">{t("nav_admin")}</div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">{t("admin_title")}</h1>
            <p className="text-muted-foreground">{t("admin_sub")}</p>
          </div>
        </section>
        <section className="section-pad">
          <div className="container-rural space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="card-soft p-5">
                <div className="grid lg:grid-cols-5 gap-3 items-end">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      {t("track_label")}
                    </div>
                    <div className="font-bold">{app.code}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{t("admin_user")}</div>
                    <div className="font-semibold">{app.user_name}</div>
                    {app.user_email && <div className="text-xs text-muted-foreground">{app.user_email}</div>}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{t("dashboard_service")}</div>
                    <div className="font-semibold">{app.service_name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">{t("admin_current_status")}</div>
                    <StatusBadge status={app.status} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">{t("admin_update_status")}</label>
                     <select
                       value={app.status}
                       onChange={async (e) => {
                         try {
                           await updateApplicationStatus(app.id, e.target.value as (typeof STATUS_FLOW)[number]);
                           toast.success(t("admin_status_updated"));
                         } catch {
                           toast.error(t("admin_status_update_failed"));
                         }
                       }}
                       className="w-full rounded-xl border border-border bg-background h-10 px-3 text-sm"
                     >
                      {STATUS_FLOW.map((statusValue) => (
                        <option key={statusValue} value={statusValue}>
                          {t(STATUS_LABEL_KEYS[statusValue])}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPage;
