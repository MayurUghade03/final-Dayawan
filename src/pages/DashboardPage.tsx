import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useApplications } from "@/contexts/ApplicationContext";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { FileSearch } from "lucide-react";

const DashboardPage = () => {
  const { t } = useLang();
  const { status } = useAuth();
  const { myApplications } = useApplications();

  if (status === "unauthenticated") return <Navigate to="/login" replace state={{ from: "/dashboard" }} />;
  if (status === "loading") return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="hero-bg border-b border-border">
          <div className="container-rural py-12 sm:py-16">
            <div className="heading-eyebrow mb-3">{t("nav_dashboard")}</div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">{t("dashboard_title")}</h1>
            <p className="text-muted-foreground">{t("dashboard_sub")}</p>
          </div>
        </section>

        <section className="section-pad">
          <div className="container-rural">
            {myApplications.length === 0 ? (
              <div className="card-soft p-8 text-center max-w-2xl mx-auto">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <FileSearch className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-lg mb-2">{t("dashboard_empty_title")}</h3>
                <p className="text-sm text-muted-foreground mb-5">{t("dashboard_empty_sub")}</p>
                <Button asChild className="rounded-xl">
                  <Link to="/services">{t("nav_services")}</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {myApplications.map((app) => (
                  <div key={app.id} className="card-soft p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                          {t("track_label")}
                        </div>
                        <div className="font-bold text-lg">{app.code}</div>
                      </div>
                      <StatusBadge status={app.status} />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-muted-foreground">{t("dashboard_service")}</div>
                        <div className="font-semibold">{app.service_name}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">{t("dashboard_phone")}</div>
                        <div className="font-semibold">{app.phone}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">{t("dashboard_updated")}</div>
                        <div className="font-semibold">{new Date(app.updated_at).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DashboardPage;
