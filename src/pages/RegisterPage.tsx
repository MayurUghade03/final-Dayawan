import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8),
  confirm: z.string().min(1),
});

const RegisterPage = () => {
  const { t } = useLang();
  const { signUp, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(t("form_error"));
      return;
    }
    if (form.password !== form.confirm) {
      toast.error(t("register_err_match"));
      return;
    }

    setLoading(true);
    const error = await signUp(form.email, form.password, form.name);
    setLoading(false);

    if (!error) {
      toast.success("Registration successful. Please verify your email before login.");
      navigate("/verify-email", { state: { email: form.email.trim().toLowerCase(), from } });
      return;
    }

    if (error.message === "AUTH_NOT_CONFIGURED") return; // banner already shown

    toast.error(t("register_err_generic"));
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
            to="/login"
            state={{ from }}
            className="text-sm font-semibold text-primary hover:underline min-h-0"
          >
            {t("nav_login")}
          </Link>
        </div>
      </header>

      {/* ── Card ────────────────────────────────────────────── */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">
              {t("register_title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("register_sub")}{" "}
              <Link to="/login" state={{ from }} className="text-primary font-semibold hover:underline min-h-0">
                {t("nav_login")}
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
              <Label htmlFor="name" className="text-sm font-semibold">
                {t("register_name")}
              </Label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1.5 h-12 text-base rounded-xl"
                maxLength={80}
                required
                disabled={!isConfigured}
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-semibold">
                {t("register_email")}
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
                {t("register_password")}
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1.5 h-12 text-base rounded-xl"
                minLength={8}
                required
                disabled={!isConfigured}
              />
            </div>

            <div>
              <Label htmlFor="confirm" className="text-sm font-semibold">
                {t("register_confirm")}
              </Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                className="mt-1.5 h-12 text-base rounded-xl"
                required
                disabled={!isConfigured}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !isConfigured}
              className="w-full h-12 bg-primary hover:bg-primary-hover text-primary-foreground text-base font-semibold rounded-xl"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                t("register_btn")
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;
