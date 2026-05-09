import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLang } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2, Search, FileSearch, CheckCircle2, Clock3, PackageCheck, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import type { ApplicationStatus, ServiceApplication } from "@/types";
import { useApplications } from "@/contexts/ApplicationContext";
import { StatusBadge } from "@/components/StatusBadge";

const TrackPage = () => {
  const { t } = useLang();
  const { findByCode } = useApplications();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { found: boolean; data?: ServiceApplication }>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = code.trim().toUpperCase();
    if (!key) return;
    setLoading(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 400));
    const data = await findByCode(key);
    if (data) {
      setResult({ found: true, data });
      toast.success(t("track_found"));
    } else {
      setResult({ found: false });
      toast.error(t("track_empty_t"));
    }
    setLoading(false);
  };

  const steps: { key: ApplicationStatus; label: string; icon: typeof CheckCircle2 }[] = [
    { key: "submitted", label: t("status_submitted"), icon: ClipboardCheck },
    { key: "received", label: t("status_received"), icon: CheckCircle2 },
    { key: "processing", label: t("status_processing"), icon: Clock3 },
    { key: "ready", label: t("status_ready"), icon: PackageCheck },
    { key: "completed", label: t("status_completed"), icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="hero-bg border-b border-border">
          <div className="container-rural py-14 sm:py-20 text-center max-w-2xl mx-auto">
            <div className="heading-eyebrow mb-3">{t("nav_track")}</div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">{t("track_title")}</h1>
            <p className="text-muted-foreground">{t("track_sub")}</p>
          </div>
        </section>

        <section className="section-pad">
          <div className="container-rural max-w-3xl">
            <form onSubmit={submit} className="card-soft p-6 sm:p-7 space-y-5">
              <div>
                <Label htmlFor="code" className="text-sm font-semibold">
                  {t("track_label")}
                </Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={t("track_demo_hint")}
                  className="mt-1.5 h-12 text-base rounded-xl uppercase"
                  maxLength={20}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-primary hover:bg-primary-hover text-primary-foreground text-base font-semibold rounded-xl"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" /> {t("track_btn")}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6">
              {result?.found && result.data && (
                <div className="card-soft p-6 sm:p-7">
                  <div className="flex flex-wrap gap-2 items-start justify-between mb-5">
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                        {t("track_label")}
                      </div>
                      <div className="font-bold text-lg text-foreground">{result.data.code}</div>
                    </div>
                    <StatusBadge status={result.data.status} />
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-muted/60">
                      <div className="text-xs text-muted-foreground">{t("dashboard_name")}</div>
                      <div className="font-semibold">{result.data.user_name}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/60">
                      <div className="text-xs text-muted-foreground">{t("dashboard_service")}</div>
                      <div className="font-semibold">{result.data.service_name}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/60">
                      <div className="text-xs text-muted-foreground">{t("dashboard_updated")}</div>
                      <div className="font-semibold">{new Date(result.data.updated_at).toLocaleString()}</div>
                    </div>
                  </div>

                  <ol className="relative grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {steps.map((s, i) => {
                      const activeIdx = steps.findIndex((x) => x.key === result.data!.status);
                      const done = i <= activeIdx;
                      const Icon = s.icon;
                      return (
                        <li key={s.key} className="flex flex-col items-center text-center">
                          <div
                            className={`h-11 w-11 rounded-full flex items-center justify-center border-2 ${
                              done
                                ? "bg-primary border-primary text-primary-foreground"
                                : "bg-card border-border text-muted-foreground"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <span
                            className={`mt-2 text-xs sm:text-sm font-semibold ${
                              done ? "text-primary" : "text-muted-foreground"
                            }`}
                          >
                            {s.label}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}

              {result && !result.found && (
                <div className="card-soft p-8 text-center">
                  <div className="h-14 w-14 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <FileSearch className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{t("track_empty_t")}</h3>
                  <p className="text-sm text-muted-foreground">{t("track_empty_d")}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TrackPage;
