import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLang } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { BrandLogo } from "@/components/BrandLogo";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const RATE_LIMIT_COOLDOWN_MS = 10_000;
const RATE_LIMIT_MESSAGE = "Too many requests. Please wait a moment and try again.";

const LoginPage = () => {
  const { t } = useLang();
  const { signIn, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: string })?.from ?? "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [retryBlockedUntil, setRetryBlockedUntil] = useState(0);
  const renderCountRef = useRef(0);

  const retryBlocked = retryBlockedUntil > Date.now();

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    renderCountRef.current += 1;
    if (renderCountRef.current > 1) {
      console.debug("[auth] LoginPage re-render", { count: renderCountRef.current });
    }
  });

  useEffect(() => {
    if (!retryBlockedUntil) return;
    const delay = retryBlockedUntil - Date.now();
    if (delay <= 0) {
      setRetryBlockedUntil(0);
      return;
    }
    const timeoutId = window.setTimeout(() => setRetryBlockedUntil(0), delay);
    return () => window.clearTimeout(timeoutId);
  }, [retryBlockedUntil]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (retryBlocked) {
      toast.error(RATE_LIMIT_MESSAGE);
      return;
    }

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(t("form_error"));
      return;
    }

    if (import.meta.env.DEV) {
      console.debug("[auth] Login submit started");
    }

    setLoading(true);
    try {
      const error = await signIn(form.email, form.password);
      if (!error) {
        toast.success(t("login_success"));
        navigate(from, { replace: true });
        return;
      }

      if (error.message === "AUTH_NOT_CONFIGURED") return; // banner already shown

      if (isRateLimitError(error)) {
        setRetryBlockedUntil(Date.now() + RATE_LIMIT_COOLDOWN_MS);
        toast.error(RATE_LIMIT_MESSAGE);
        return;
      }

      if (error.status === 400 || error.status === 401) {
        toast.error(t("login_err_credentials"));
      } else {
        toast.error(t("login_err_generic"));
      }
    } catch (error) {
      console.error("Unexpected login failure:", error);
      toast.error(t("login_err_generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background hero-bg">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <header className="border-b border-border bg-background/85 backdrop-blur-md">
        <div className="container-rural py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 min-h-0">
            <BrandLogo className="shadow-soft" />
            <div className="font-extrabold text-base sm:text-lg text-foreground">
              {t("brand")}
            </div>
          </Link>
          <Link
            to="/register"
            className="text-sm font-semibold text-primary hover:underline min-h-0"
          >
            {t("nav_register")}
          </Link>
        </div>
      </header>

      {/* ── Card ────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">
              {t("login_title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("login_sub")}{" "}
              <Link to="/register" className="text-primary font-semibold hover:underline min-h-0">
                {t("nav_register")}
              </Link>
            </p>
          </div>

          {/* ── Not-configured banner ───────────────────────── */}
          {!isConfigured && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-warning bg-warning/10 p-4 text-sm text-foreground">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{t("auth_not_configured_title")}</p>
                <p className="text-muted-foreground mt-0.5">{t("auth_not_configured_body")}</p>
              </div>
            </div>
          )}

          <form
            onSubmit={submit}
            className="card-soft p-6 sm:p-8 space-y-5"
          >
            <div>
              <Label htmlFor="email" className="text-sm font-semibold">
                {t("login_email")}
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1.5 h-12 text-base rounded-xl"
                required
                disabled={!isConfigured}
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-semibold">
                {t("login_password")}
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1.5 h-12 text-base rounded-xl"
                required
                disabled={!isConfigured}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !isConfigured || retryBlocked}
              className="w-full h-12 bg-primary hover:bg-primary-hover text-primary-foreground text-base font-semibold rounded-xl"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                t("login_btn")
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;

function isRateLimitError(error: { status?: number; message?: string }) {
  if (error.status === 429) return true;
  return typeof error.message === "string" && error.message.toLowerCase().includes("too many requests");
}
