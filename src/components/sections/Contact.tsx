import { useLang } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Phone, MapPin, Clock, Loader2, Mail, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

type ContactVariant = "default" | "contact-page";

type ContactProps = {
  withHeading?: boolean;
  variant?: ContactVariant;
};

const DEFAULT_PHONE = "+919999999999";
const CONTACT_PAGE_PHONE = "7264953363";
const CONTACT_PAGE_PHONE_E164 = "+917264953363";
const CONTACT_PAGE_EMAIL = "mangeshnikas210@gmail.com";
const BHALEGAON_LAT = 20.2206441;
const BHALEGAON_LNG = 76.5570153;
const DEFAULT_MAP_ZOOM = 16;
const CONTACT_MAP_ZOOM = 17;
const FORMSPREE_ENDPOINT = import.meta.env.VITE_FORMSPREE_ENDPOINT as string | undefined;
const CONTACT_FORM_SOURCE = "dayawan-contact-page";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(15).regex(/^[0-9+\-\s]+$/),
  message: z.string().trim().min(3).max(1000),
});

export function Contact({ withHeading = true, variant = "default" }: ContactProps) {
  const { t } = useLang();
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isContactPageVariant = variant === "contact-page";
  const phone = isContactPageVariant ? CONTACT_PAGE_PHONE_E164 : DEFAULT_PHONE;
  const displayPhone = isContactPageVariant ? CONTACT_PAGE_PHONE : DEFAULT_PHONE;
  const telHref = `tel:${phone}`;
  const mapZoom = isContactPageVariant ? CONTACT_MAP_ZOOM : DEFAULT_MAP_ZOOM;
  const submitButtonLabel = isSubmitted ? "Submitted" : t("form_submit");

  const mapsUrl = useMemo(
    () => `https://www.google.com/maps?q=${BHALEGAON_LAT},${BHALEGAON_LNG}&z=${mapZoom}&output=embed`,
    [mapZoom],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || isSubmitted) return;

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(t("form_error"));
      return;
    }

    if (!FORMSPREE_ENDPOINT) {
      toast.error("Contact form is not configured yet.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: parsed.data.name,
          phone: parsed.data.phone,
          message: parsed.data.message,
          source: CONTACT_FORM_SOURCE,
          page: typeof window !== "undefined" ? window.location.href : "contact",
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = getFormspreeErrorMessage(payload) ?? "Unable to submit the form right now.";
        throw new Error(message || "FORM_SUBMIT_FAILED");
      }

      setIsSubmitted(true);
      toast.success(t("form_success"));
      setForm({ name: "", phone: "", message: "" });
      window.setTimeout(() => setIsSubmitted(false), 2500);
    } catch (error) {
      const fallbackMessage = error instanceof Error ? error.message : t("form_error");
      toast.error(fallbackMessage || t("form_error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="section-pad bg-muted/30 border-t border-border">
      <div className="container-rural">
        {withHeading && (
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <div className="heading-eyebrow mb-3">{t("nav_contact")}</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">{t("contact_title")}</h2>
            <p className="text-muted-foreground">{t("contact_sub")}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10">
          <div className="space-y-5">
            <a href={telHref} className="card-soft p-5 flex items-center gap-4 hover:border-primary min-h-0">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("contact_phone")}</div>
                <div className="text-primary font-bold text-lg" dir="ltr">{displayPhone}</div>
              </div>
            </a>

            {isContactPageVariant && (
              <a href={`mailto:${CONTACT_PAGE_EMAIL}`} className="card-soft p-5 flex items-start gap-4 hover:border-primary min-h-0">
                <div className="h-12 w-12 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Email</div>
                  <div className="text-foreground font-medium break-all">{CONTACT_PAGE_EMAIL}</div>
                </div>
              </a>
            )}

            <div className="card-soft p-5 flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-secondary-soft flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t("contact_address")}</div>
                <div className="text-foreground font-medium">{t("address_value")}</div>
              </div>
            </div>

            <div className="card-soft p-5 flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t("contact_hours")}</div>
                <div className="text-foreground font-medium">{t("hours_value")}</div>
              </div>
            </div>

            <div className="card-soft mt-2 p-3 sm:p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-foreground">Find us on map</div>
                  <div className="text-xs text-muted-foreground">Lat {BHALEGAON_LAT}, Lng {BHALEGAON_LNG}</div>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${BHALEGAON_LAT},${BHALEGAON_LNG}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                >
                  Open <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
                <iframe
                  title="Map - Bhalegaon"
                  src={mapsUrl}
                  className="w-full h-[260px] sm:h-[320px] lg:h-[360px] border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </div>

          <form onSubmit={submit} className="card-soft p-7 sm:p-8 space-y-6 h-fit">
            <div>
              <Label htmlFor="name" className="text-sm font-semibold">{t("form_name")}</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1.5 h-12 text-base rounded-xl"
                maxLength={80}
                required
                disabled={loading || isSubmitted}
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm font-semibold">{t("form_phone")}</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1.5 h-12 text-base rounded-xl"
                maxLength={15}
                required
                disabled={loading || isSubmitted}
              />
            </div>
            <div>
              <Label htmlFor="message" className="text-sm font-semibold">{t("form_message")}</Label>
              <Textarea
                id="message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="mt-1.5 text-base rounded-xl min-h-[140px]"
                maxLength={1000}
                required
                disabled={loading || isSubmitted}
              />
            </div>
            <Button
              type="submit"
              disabled={loading || isSubmitted}
              className="w-full h-12 bg-primary hover:bg-primary-hover text-primary-foreground text-base font-semibold rounded-xl"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : submitButtonLabel}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}

function getFormspreeErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const errors = (payload as { errors?: Array<{ message?: string }> }).errors;
  if (!Array.isArray(errors) || errors.length === 0) return null;
  return errors[0]?.message ?? null;
}
