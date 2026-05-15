import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/contexts/AuthContext";

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { resendVerificationEmail, status, user, isConfigured } = useAuth();
  const [email, setEmail] = useState<string>(
    ((location.state as { email?: string } | null)?.email ?? user?.email ?? "").trim(),
  );
  const from = ((location.state as { from?: string } | null)?.from ?? "/").trim() || "/";
  const [resending, setResending] = useState(false);

  const verificationError = useMemo(() => {
    const query = new URLSearchParams(location.search);
    const hash = new URLSearchParams(location.hash.replace(/^#/, ""));
    const message = query.get("error_description") || hash.get("error_description") || query.get("error");
    if (!message) return null;
    const normalized = decodeURIComponent(message).toLowerCase();
    if (normalized.includes("expired")) return "Verification link expired. Please request a new verification email.";
    return "Verification link is invalid or already used. Please request a fresh verification email.";
  }, [location.hash, location.search]);

  const emailVerified = status === "authenticated" && Boolean(user?.email_confirmed_at);

  const resend = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error("Please enter your registered email address.");
      return;
    }
    setResending(true);
    try {
      const error = await resendVerificationEmail(normalizedEmail);
      if (error) {
        toast.error("Unable to resend verification email right now. Please try again.");
        return;
      }
      toast.success("Verification email sent. Please check your inbox.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background hero-bg">
      <header className="border-b border-border bg-background/85 backdrop-blur-md">
        <div className="container-rural py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 min-h-0">
            <BrandLogo className="shadow-soft" />
            <div className="font-extrabold text-base sm:text-lg text-foreground">Dayawan Village Connect</div>
          </Link>
          <Link to="/login" state={{ from }} className="text-sm font-semibold text-primary hover:underline min-h-0">
            Go to Login
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md card-soft p-6 sm:p-8 space-y-5">
          <div className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-xl bg-primary-soft flex items-center justify-center">
              <MailCheck className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">Verify your email</h1>
            <p className="text-sm text-muted-foreground">
              {emailVerified
                ? "Email verified successfully. You can now log in."
                : "Registration successful. Please verify your email before login."}
            </p>
          </div>

          {verificationError && (
            <div className="rounded-xl border border-warning bg-warning/10 p-3 text-sm text-foreground">
              {verificationError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="verify-email-input">Registered email</Label>
            <Input
              id="verify-email-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={!isConfigured || resending}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={() => void resend()} disabled={!isConfigured || resending}>
              {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resend Verification Email"}
            </Button>
            <Button type="button" onClick={() => navigate("/login", { state: { from } })}>
              Go to Login
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VerifyEmailPage;
