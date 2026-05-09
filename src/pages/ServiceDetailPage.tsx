import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SERVICES } from "@/i18n/translations";
import { useLang } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, IndianRupee, Clock, Phone, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useApplications } from "@/contexts/ApplicationContext";

const ServiceDetailPage = () => {
  const { id } = useParams();
  const { t, tr } = useLang();
  const navigate = useNavigate();
  const { user, status } = useAuth();
  const { submitApplication } = useApplications();
  const service = SERVICES.find((s) => s.id === id);
  const [form, setForm] = useState({
    name: user?.user_metadata?.full_name ?? "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.user_metadata?.full_name) return;
    setForm((prev) => ({ ...prev, name: String(user.user_metadata.full_name) }));
  }, [user]);

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container-rural py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">{t("not_found_title")}</h1>
          <Button onClick={() => navigate("/services")} variant="outline">{t("back")}</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="hero-bg border-b border-border">
          <div className="container-rural py-12 sm:py-16">
            <Link to="/services" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline min-h-0 mb-6">
              <ArrowLeft className="h-4 w-4" /> {t("back")}
            </Link>
            <div className="chip chip-primary mb-4">{t(`cat_${service.category}` as const)}</div>
            <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 max-w-3xl">{tr(service.title)}</h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">{tr(service.long ?? service.desc)}</p>
          </div>
        </section>

        <section className="section-pad">
          <div className="container-rural grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="card-soft p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold">{t("required_docs")}</h2>
                </div>
                <ul className="grid sm:grid-cols-2 gap-2.5">
                  {service.docs.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 p-3 rounded-xl bg-muted/60">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-foreground">{tr(d)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <aside className="space-y-4">
              {service.fee && (
                <div className="card-soft p-5 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary-soft flex items-center justify-center shrink-0">
                    <IndianRupee className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fee</div>
                    <div className="font-bold text-foreground">{tr(service.fee)}</div>
                  </div>
                </div>
              )}
              {service.time && (
                <div className="card-soft p-5 flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary-soft flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</div>
                    <div className="font-bold text-foreground">{tr(service.time)}</div>
                  </div>
                </div>
              )}

              <div className="card-soft p-5">
                <h3 className="font-bold text-lg mb-1">{t("apply_title")}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("apply_sub")}</p>
                <form
                  className="space-y-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (status !== "authenticated" || !user) {
                      navigate("/login", { state: { from: `/services/${service.id}` } });
                      return;
                    }
                    if (!form.name.trim() || !form.phone.trim()) {
                      toast.error(t("apply_err_required"));
                      return;
                    }
                    if (!/^\d{10}$/.test(form.phone.trim())) {
                      toast.error(t("apply_err_phone"));
                      return;
                    }
                    setSubmitting(true);
                    try {
                      const newApplication = await submitApplication({
                        user_name: form.name.trim(),
                        phone: form.phone.trim(),
                        service_id: service.id,
                        service_name: tr(service.title),
                      });
                      toast.success(`${t("apply_success")} ${newApplication.code}`);
                      navigate("/dashboard");
                    } catch {
                      toast.error(t("apply_err_submit"));
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  <div>
                    <Label htmlFor="apply-name">{t("register_name")}</Label>
                    <Input
                      id="apply-name"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="mt-1.5 rounded-xl"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="apply-phone">{t("form_phone")}</Label>
                    <Input
                      id="apply-phone"
                      value={form.phone}
                      onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className="mt-1.5 rounded-xl"
                      placeholder={t("form_phone_placeholder")}
                      disabled={submitting}
                    />
                  </div>
                  <Button type="submit" className="w-full rounded-xl h-11 font-semibold">
                    {submitting ? `${t("apply_btn")}...` : t("apply_btn")}
                  </Button>
                </form>
              </div>

              <div className="card-soft p-6 bg-primary text-primary-foreground border-primary">
                <h3 className="font-bold text-lg mb-2">{t("cta_contact")}</h3>
                <p className="text-sm text-primary-foreground/80 mb-4">{t("contact_sub")}</p>
                <div className="space-y-2">
                  <Button asChild size="lg" variant="secondary" className="w-full rounded-xl h-12 font-semibold">
                    <a href="tel:+919999999999"><Phone className="mr-2 h-4 w-4" /> +91 99999 99999</a>
                  </Button>
                  <Button
                    onClick={() => { toast.success(t("form_success")); navigate("/contact"); }}
                    variant="outline"
                    className="w-full rounded-xl h-12 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground font-semibold"
                  >
                    {t("nav_contact")}
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ServiceDetailPage;
