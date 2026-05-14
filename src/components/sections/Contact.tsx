import { useLang } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Phone, MapPin, Clock, Loader2, Mail, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const PHONE = "7264953363";
const PHONE_HREF = `+91${PHONE}`;
const EMAIL = "mangeshnikas210@gmail.com";
const BHALEGAON_LAT = 20.2206441;
const BHALEGAON_LNG = 76.5570153;
const FORMSPREE_ENDPOINT = import.meta.env.VITE_FORMSPREE_ENDPOINT as string | undefined;
const FORMSPREE_TIMEOUT_MS = 12000;

type FormspreeErrorResponse = {
  errors?: Array<{ message?: string }>;
};

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(15).regex(/^[0-9+\-\s]+$/),
  message: z.string().trim().min(3).max(1000),
});

export function Contact({ withHeading = true }: { withHeading?: boolean }) {
  const { t } = useLang();
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(t("form_error"));
      return;
    }

    const endpoint = getFormspreeEndpoint(FORMSPREE_ENDPOINT);
    if (!endpoint) {
      toast.error("Contact form is not configured yet.");
      return;
    }

    setLoading(true);
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), FORMSPREE_TIMEOUT_MS);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(parsed.data),
        signal: controller.signal,
      });
      window.clearTimeout(timer);

      if (!response.ok) {
        const fallbackMessage = "Failed to send message. Please try again.";
        const payload = await response.json().catch(() => null) as FormspreeErrorResponse | null;
        const errorMessage = payload?.errors?.[0]?.message || fallbackMessage;
        toast.error(errorMessage);
        return;
      }

      if (isSupabaseConfigured && supabase) {
        const { error: contactLogError } = await supabase.from("contact_requests").insert({
          name: parsed.data.name,
          phone: parsed.data.phone,
          message: parsed.data.message,
          source: "website-contact-form",
        });
        if (contactLogError) {
          console.error("Unable to store contact request in Supabase:", contactLogError);
        }
      }

      toast.success(t("form_success"));
      setForm({ name: "", phone: "", message: "" });
    } catch {
      toast.error("Unable to submit right now. Please try again in a moment.");
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
            <a href={`tel:${PHONE_HREF}`} className="card-soft p-5 flex items-center gap-4 hover:border-primary min-h-0">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("contact_phone")}</div>
                <div className="text-primary font-bold text-lg" dir="ltr">{PHONE}</div>
              </div>
            </a>

            <a href={`mailto:${EMAIL}`} className="card-soft p-5 flex items-center gap-4 hover:border-primary min-h-0">
              <div className="h-12 w-12 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</div>
                <div className="text-primary font-bold text-base break-all">{EMAIL}</div>
              </div>
            </a>

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

            <div className="card-soft overflow-hidden mt-2 rounded-2xl border border-border bg-muted/20">
              <iframe
                title="Map - Bhalegaon"
                src={`https://www.google.com/maps?q=${BHALEGAON_LAT},${BHALEGAON_LNG}&z=17&output=embed`}
                className="w-full h-80 border-0 rounded-2xl"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="p-3 border-t border-border bg-background/90">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${BHALEGAON_LAT},${BHALEGAON_LNG}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                >
                  Open interactive map
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
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
                disabled={loading}
                required
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
                disabled={loading}
                required
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
                disabled={loading}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary-hover text-primary-foreground text-base font-semibold rounded-xl"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("form_submit")}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}

function getFormspreeEndpoint(value?: string): string | null {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:") return null;
    if (url.hostname !== "formspree.io" && !url.hostname.endsWith(".formspree.io")) return null;
    if (!/^\/f\/[\w-]+\/?$/.test(url.pathname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}
