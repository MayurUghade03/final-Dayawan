import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useLang } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, IndianRupee, Phone, CheckCircle2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useApplications } from "@/contexts/ApplicationContext";
import { useServiceCatalog } from "@/contexts/ServiceCatalogContext";
import { Textarea } from "@/components/ui/textarea";

type FormState = {
  name: string;
  phone: string;
  extraFields: Record<string, string>;
  submittedDocuments: Record<string, string>;
  paymentPaid: boolean;
  paymentRef: string;
};

const ServiceDetailPage = () => {
  const { id } = useParams();
  const { t } = useLang();
  const navigate = useNavigate();
  const { user, status } = useAuth();
  const { submitApplication } = useApplications();
  const { getServiceById } = useServiceCatalog();
  const service = id ? getServiceById(id) : undefined;
  const [form, setForm] = useState<FormState>({
    name: user?.user_metadata?.full_name ?? "",
    phone: "",
    extraFields: {},
    submittedDocuments: {},
    paymentPaid: false,
    paymentRef: "",
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
            <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 max-w-3xl">{service.title}</h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">{service.details || service.description}</p>
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
                  {service.required_documents.map((documentName) => (
                    <li key={documentName} className="flex items-start gap-2 p-3 rounded-xl bg-muted/60">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-foreground">{documentName}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="card-soft p-5 flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary-soft flex items-center justify-center shrink-0">
                  <IndianRupee className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fee</div>
                  <div className="font-bold text-foreground">
                    {service.fee_amount > 0 ? `₹${service.fee_amount.toFixed(2)}` : "Free"}
                  </div>
                  {service.fee_note && (
                    <div className="text-xs text-muted-foreground mt-1">{service.fee_note}</div>
                  )}
                </div>
              </div>

              <div className="card-soft p-5 flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary-soft flex items-center justify-center shrink-0">
                  <CreditCard className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Mode</div>
                  <div className="font-bold text-foreground">
                    {service.payment_provider === "none" ? "No gateway selected" : `${service.payment_provider} (dummy)`}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Gateway is kept dummy for now and ready for integration.
                  </div>
                </div>
              </div>

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
                    const missingDocuments = service.required_documents.filter(
                      (documentName) => !form.submittedDocuments[documentName]?.trim(),
                    );
                    if (missingDocuments.length > 0) {
                      toast.error(`Missing documents: ${missingDocuments.join(", ")}`);
                      return;
                    }
                    const invalidField = service.form_schema.find((field) => field.required && !form.extraFields[field.key]?.trim());
                    if (invalidField) {
                      toast.error(`Please fill: ${invalidField.label}`);
                      return;
                    }
                    if (service.fee_amount > 0 && !form.paymentPaid) {
                      toast.error("Please complete dummy payment before submit.");
                      return;
                    }
                    setSubmitting(true);
                    try {
                      const newApplication = await submitApplication({
                        user_name: form.name.trim(),
                        phone: form.phone.trim(),
                        service_id: service.id,
                        service_name: service.title,
                        form_payload: service.form_schema.reduce<Record<string, string>>((acc, field) => {
                          acc[field.key] = form.extraFields[field.key] ?? "";
                          return acc;
                        }, {}),
                        submitted_documents: service.required_documents
                          .map((documentName) => form.submittedDocuments[documentName] || "")
                          .filter((name) => name.trim().length > 0),
                        payment_status: form.paymentPaid ? "paid" : "pending",
                        payment_provider: service.payment_provider,
                        payment_reference: form.paymentRef || undefined,
                        amount: service.fee_amount,
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
                  {service.form_schema.map((field) => (
                    <div key={field.id}>
                      <Label htmlFor={`apply-extra-${field.id}`}>{field.label}</Label>
                      {field.type === "textarea" ? (
                        <Textarea
                          id={`apply-extra-${field.id}`}
                          value={form.extraFields[field.key] ?? ""}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              extraFields: { ...prev.extraFields, [field.key]: e.target.value },
                            }))
                          }
                          className="mt-1.5 rounded-xl"
                          disabled={submitting}
                        />
                      ) : (
                        <Input
                          id={`apply-extra-${field.id}`}
                          type={field.type}
                          value={form.extraFields[field.key] ?? ""}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              extraFields: { ...prev.extraFields, [field.key]: e.target.value },
                            }))
                          }
                          className="mt-1.5 rounded-xl"
                          disabled={submitting}
                        />
                      )}
                    </div>
                  ))}
                  {service.required_documents.map((documentName) => (
                    <div key={documentName}>
                      <Label htmlFor={`apply-doc-${documentName}`}>{documentName}</Label>
                      <Input
                        id={`apply-doc-${documentName}`}
                        type="file"
                        className="mt-1.5 rounded-xl"
                        disabled={submitting}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          setForm((prev) => ({
                            ...prev,
                            submittedDocuments: {
                              ...prev.submittedDocuments,
                              [documentName]: file?.name ?? "",
                            },
                          }));
                        }}
                      />
                      {form.submittedDocuments[documentName] && (
                        <div className="text-xs text-muted-foreground mt-1">{form.submittedDocuments[documentName]}</div>
                      )}
                    </div>
                  ))}
                  {service.fee_amount > 0 && (
                    <div className="rounded-xl border border-border p-3 bg-muted/30 space-y-2">
                      <div className="text-sm font-semibold">
                        Dummy payment: ₹{service.fee_amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Provider: {service.payment_provider === "none" ? "Manual" : service.payment_provider}
                      </div>
                      <Button
                        type="button"
                        variant={form.paymentPaid ? "secondary" : "outline"}
                        className="w-full"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            paymentPaid: true,
                            paymentRef: prev.paymentRef || `DUMMY-${Date.now()}`,
                          }))
                        }
                        disabled={submitting}
                      >
                        {form.paymentPaid ? "Payment completed" : "Pay now (Dummy)"}
                      </Button>
                    </div>
                  )}
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
