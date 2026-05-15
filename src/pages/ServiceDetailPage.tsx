import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useLang } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileText, IndianRupee, Phone, CheckCircle2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useApplications } from "@/contexts/ApplicationContext";
import { useServiceCatalog } from "@/contexts/ServiceCatalogContext";
import { Textarea } from "@/components/ui/textarea";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { SubmittedDocument } from "@/types";

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

type FormState = {
  name: string;
  phone: string;
  extraFields: Record<string, string>;
  submittedDocuments: Record<string, File | null>;
  dynamicFieldFiles: Record<string, File | null>;
  paymentProof: File | null;
  paymentProofPreview: string;
  transactionId: string;
};

const ServiceDetailPage = () => {
  const { id } = useParams();
  const { t } = useLang();
  const navigate = useNavigate();
  const { user, status, isAdmin, isSuspended } = useAuth();
  const { submitApplication } = useApplications();
  const { getServiceById } = useServiceCatalog();
  const service = id ? getServiceById(id) : undefined;
  const [form, setForm] = useState<FormState>({
    name: user?.user_metadata?.full_name ?? "",
    phone: "",
    extraFields: {},
    submittedDocuments: {},
    dynamicFieldFiles: {},
    paymentProof: null,
    paymentProofPreview: "",
    transactionId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const dynamicFileFields = useMemo(() => service?.form_schema.filter((field) => field.type === "file") ?? [], [service?.form_schema]);

  useEffect(() => {
    if (!user?.user_metadata?.full_name) return;
    setForm((prev) => ({ ...prev, name: String(user.user_metadata.full_name) }));
  }, [user]);

  const canApply = !isAdmin && !isSuspended;

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
            {service.image_url && (
              <div className="mt-6 max-w-3xl rounded-2xl overflow-hidden border border-border bg-muted/30">
                <img src={service.image_url} alt={service.title} className="w-full max-h-[320px] object-cover" loading="lazy" />
              </div>
            )}
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

              <div className="card-soft p-6">
                <h3 className="font-bold text-lg mb-1">{t("apply_title")}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {canApply ? t("apply_sub") : "This account type cannot apply for services."}
                </p>
                {canApply ? (
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
                        (documentName) => !form.submittedDocuments[documentName],
                      );
                      if (missingDocuments.length > 0) {
                        toast.error(`Missing documents: ${missingDocuments.join(", ")}`);
                        return;
                      }
                      const invalidField = service.form_schema.find((field) => {
                        if (!field.required || field.type === "file") return false;
                        const value = form.extraFields[field.key] ?? "";
                        if (field.type === "checkbox") return value !== "true";
                        return !value.trim();
                      });
                      if (invalidField) {
                        toast.error(`Please fill: ${invalidField.label}`);
                        return;
                      }
                      const missingDynamicFileField = dynamicFileFields.find((field) => field.required && !form.dynamicFieldFiles[field.key]);
                      if (missingDynamicFileField) {
                        toast.error(`Please upload: ${missingDynamicFileField.label}`);
                        return;
                      }
                      if (service.fee_amount > 0 && !form.paymentProof) {
                        toast.error("Please upload payment screenshot before submit.");
                        return;
                      }

                      setSubmitting(true);
                      try {
                        const uploadedDocuments = await uploadDocuments({
                          serviceId: service.id,
                          userId: user.id,
                          documents: {
                            ...Object.fromEntries(Object.entries(form.submittedDocuments).map(([key, file]) => [key, { file, kind: "required_document" as const }])),
                            ...Object.fromEntries(dynamicFileFields.map((field) => [field.label, { file: form.dynamicFieldFiles[field.key], kind: "dynamic_field_file" as const }])),
                            ...(form.paymentProof ? { "Payment Screenshot": { file: form.paymentProof, kind: "payment_proof" as const } } : {}),
                          },
                        });

                        const newApplication = await submitApplication({
                          user_name: form.name.trim(),
                          phone: form.phone.trim(),
                          service_id: service.id,
                          service_name: service.title,
                          form_payload: service.form_schema.reduce<Record<string, string>>((acc, field) => {
                            acc[field.key] = form.extraFields[field.key] ?? "";
                            return acc;
                          }, {}),
                          submitted_documents: uploadedDocuments,
                          payment_status: service.fee_amount > 0 ? "pending" : "verified",
                          payment_provider: service.payment_provider,
                          payment_reference: form.transactionId || undefined,
                          transaction_id: form.transactionId || undefined,
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
                      ) : field.type === "select" ? (
                        <select
                          id={`apply-extra-${field.id}`}
                          value={form.extraFields[field.key] ?? ""}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              extraFields: { ...prev.extraFields, [field.key]: e.target.value },
                            }))
                          }
                          className="mt-1.5 w-full rounded-xl border border-border bg-background h-10 px-3 text-sm"
                          disabled={submitting}
                        >
                          <option value="">Select an option</option>
                          {(field.options ?? []).map((option) => (
                            <option key={`${field.id}-${option}`} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : field.type === "radio" ? (
                        <div className="mt-2 flex flex-wrap gap-3">
                          {(field.options ?? []).map((option) => (
                            <label key={`${field.id}-${option}`} className="inline-flex items-center gap-2 text-sm">
                              <input
                                type="radio"
                                name={`apply-extra-${field.id}`}
                                value={option}
                                checked={(form.extraFields[field.key] ?? "") === option}
                                onChange={(e) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    extraFields: { ...prev.extraFields, [field.key]: e.target.value },
                                  }))
                                }
                                disabled={submitting}
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      ) : field.type === "checkbox" ? (
                        <label className="mt-2 inline-flex items-center gap-2 text-sm">
                          <input
                            id={`apply-extra-${field.id}`}
                            type="checkbox"
                            checked={(form.extraFields[field.key] ?? "") === "true"}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                extraFields: { ...prev.extraFields, [field.key]: e.target.checked ? "true" : "false" },
                              }))
                            }
                            disabled={submitting}
                          />
                          <span>Yes</span>
                        </label>
                      ) : field.type === "file" ? (
                        <div>
                          <Input
                            id={`apply-extra-${field.id}`}
                            type="file"
                            className="mt-1.5 rounded-xl"
                            disabled={submitting}
                            accept=".jpg,.jpeg,.png,.webp,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              const validationError = file ? validateUploadFile(file) : null;
                              if (validationError) {
                                toast.error(validationError);
                                return;
                              }
                              setForm((prev) => ({
                                ...prev,
                                dynamicFieldFiles: { ...prev.dynamicFieldFiles, [field.key]: file },
                              }));
                            }}
                          />
                          {form.dynamicFieldFiles[field.key] && (
                            <div className="text-xs text-muted-foreground mt-1">{form.dynamicFieldFiles[field.key]?.name}</div>
                          )}
                        </div>
                      ) : (
                        <Input
                          id={`apply-extra-${field.id}`}
                          type={field.type === "number" || field.type === "date" ? field.type : "text"}
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
                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          const validationError = file ? validateUploadFile(file) : null;
                          if (validationError) {
                            toast.error(validationError);
                            return;
                          }
                          setForm((prev) => ({
                            ...prev,
                            submittedDocuments: {
                              ...prev.submittedDocuments,
                              [documentName]: file ?? null,
                            },
                          }));
                        }}
                      />
                      {form.submittedDocuments[documentName] && (
                        <div className="text-xs text-muted-foreground mt-1">{form.submittedDocuments[documentName]?.name}</div>
                      )}
                    </div>
                  ))}
                  {service.fee_amount > 0 && (
                    <div className="rounded-xl border border-border p-3 bg-muted/30 space-y-2">
                      <div className="text-sm font-semibold">
                        Manual payment: ₹{service.fee_amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">Scan the QR and pay manually, then upload screenshot.</div>
                      {service.payment_qr_image_url ? (
                        <div className="rounded-lg overflow-hidden border border-border bg-background max-w-xs">
                          <img
                            src={service.payment_qr_image_url}
                            alt={`${service.title} payment QR`}
                            className="w-full h-auto object-contain"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="text-xs text-warning">Payment QR not configured by admin yet.</div>
                      )}
                      <div>
                        <Label htmlFor="payment-proof">Payment screenshot / proof</Label>
                        <Input
                          id="payment-proof"
                          type="file"
                          className="mt-1.5 rounded-xl"
                          accept=".jpg,.jpeg,.png,.webp,.pdf"
                          disabled={submitting}
                          onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            const validationError = file ? validateUploadFile(file) : null;
                            if (validationError) {
                              toast.error(validationError);
                              return;
                            }
                            const preview = file && file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
                            setForm((prev) => ({
                              ...prev,
                              paymentProof: file,
                              paymentProofPreview: preview,
                            }));
                          }}
                        />
                        {form.paymentProof && (
                          <div className="text-xs text-muted-foreground mt-1">{form.paymentProof.name}</div>
                        )}
                        {form.paymentProofPreview && (
                          <img src={form.paymentProofPreview} alt="Payment proof preview" className="mt-2 max-h-40 rounded-lg border border-border object-contain bg-background" />
                        )}
                      </div>
                      <div>
                        <Label htmlFor="payment-ref">Transaction ID / UTR (optional)</Label>
                        <Input
                          id="payment-ref"
                          value={form.transactionId}
                          onChange={(e) => setForm((prev) => ({ ...prev, transactionId: e.target.value }))}
                          className="mt-1.5 rounded-xl"
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  )}
                  <Button type="submit" className="w-full rounded-xl h-11 font-semibold">
                    {submitting ? `${t("apply_btn")}...` : t("apply_btn")}
                  </Button>
                  </form>
                ) : (
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    Admin and suspended accounts are restricted from citizen service applications.
                  </div>
                )}
              </div>

              <div className="card-soft p-6 bg-primary text-primary-foreground border-primary">
                <h3 className="font-bold text-lg mb-2">{t("cta_contact")}</h3>
                <p className="text-sm text-primary-foreground/80 mb-4">{t("contact_sub")}</p>
                <div className="space-y-2">
                  <Button asChild size="lg" variant="secondary" className="w-full rounded-xl h-12 font-semibold">
                    <a href="tel:+917264953363"><Phone className="mr-2 h-4 w-4" /> +91 72649 53363</a>
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

async function uploadDocuments({
  serviceId,
  userId,
  documents,
}: {
  serviceId: string;
  userId: string;
  documents: Record<string, { file: File | null; kind: SubmittedDocument["kind"] }>;
}): Promise<SubmittedDocument[]> {
  const entries = Object.entries(documents).filter(([, value]) => Boolean(value.file));
  if (entries.length === 0) return [];

  if (!isSupabaseConfigured || !supabase) {
    return entries.map(([label, value]) => ({
      name: value.file?.name || label,
      kind: value.kind,
      mime_type: value.file?.type,
      size: value.file?.size,
      uploaded_at: new Date().toISOString(),
    }));
  }

  const uploaded: SubmittedDocument[] = [];
  for (const [label, value] of entries) {
    const file = value.file;
    if (!file) continue;
    const ext = getFileExtension(file.name);
    const storagePath = `${userId}/${serviceId}/${Date.now()}-${generateStorageId()}-${slugifyLabel(label)}${ext}`;
    const { error } = await supabase.storage.from("application-documents").upload(storagePath, file);
    if (error) throw error;

    uploaded.push({
      name: label,
      kind: value.kind,
      path: storagePath,
      mime_type: file.type,
      size: file.size,
      uploaded_at: new Date().toISOString(),
    });
  }

  return uploaded;
}

function getFileExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx <= 0 || idx === name.length - 1) return "";
  return name.slice(idx).replace(/[^a-zA-Z0-9.]/g, "");
}

function generateStorageId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 14);
}

function slugifyLabel(label: string): string {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "document";
}

function validateUploadFile(file: File): string | null {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) return "File size should be 5MB or less.";
  if (!ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number])) {
    return "Only JPG, PNG, WEBP, and PDF files are allowed.";
  }
  return null;
}
