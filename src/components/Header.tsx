import { useLang } from "@/i18n/LanguageContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Sprout, Menu, X, LogIn, LogOut, UserCircle2 } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function Header() {
  const { t } = useLang();
  const { user, status, signOut, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const links = [
    { to: "/", label: t("nav_home") },
    { to: "/services", label: t("nav_services") },
    { to: "/track", label: t("nav_track") },
    { to: "/faq", label: t("nav_faq") },
    { to: "/about", label: t("nav_about") },
    { to: "/contact", label: t("nav_contact") },
  ];

  const handleSignOut = async () => {
    await signOut();
    toast.success(t("nav_logout"));
  };

  const isAuthenticated = status === "authenticated" && user;
  const dashboardLinks = isAuthenticated
    ? [{ to: "/dashboard", label: t("nav_dashboard") }, ...(isAdmin ? [{ to: "/admin", label: t("nav_admin") }] : [])]
    : [];

  return (
    <header className="sticky top-0 z-40 w-full bg-background/85 backdrop-blur-md border-b border-border">
      <div className="container-rural flex items-center justify-between py-3">
        <Link to="/" className="flex items-center gap-2.5 min-h-0">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-soft">
            <Sprout className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-extrabold text-base sm:text-lg text-foreground">{t("brand")}</div>
            <div className="text-[11px] text-muted-foreground hidden sm:block">{t("brand_tag")}</div>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
          {[...links, ...dashboardLinks].map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 rounded-lg transition-colors min-h-0",
                  isActive ? "text-primary bg-primary-soft" : "text-foreground/80 hover:text-primary hover:bg-muted",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          {/* ── Auth controls (desktop) ─────────────────────────────── */}
          {status !== "loading" && (
            <div className="hidden lg:flex items-center gap-2">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 rounded-full border h-9 px-3">
                      <UserCircle2 className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground max-w-[120px] truncate">
                        {user.user_metadata?.full_name ?? user.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[160px] rounded-xl">
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-base py-2.5 cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {t("nav_logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm" className="rounded-full h-9 px-3 font-semibold">
                    <Link to="/login">
                      <LogIn className="h-4 w-4 mr-1.5" />
                      {t("nav_login")}
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="rounded-full h-9 px-4 font-semibold bg-primary text-primary-foreground hover:bg-primary-hover">
                    <Link to="/register">{t("nav_register")}</Link>
                  </Button>
                </>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="lg:hidden h-10 w-10 inline-flex items-center justify-center rounded-lg border border-border text-foreground"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="container-rural py-2 flex flex-col">
            {[...links, ...dashboardLinks].map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-3 rounded-lg text-base",
                    isActive ? "text-primary bg-primary-soft font-semibold" : "text-foreground hover:bg-muted",
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}

            {/* ── Auth controls (mobile) ───────────────────────────── */}
            {status !== "loading" && (
              <div className="border-t border-border mt-2 pt-2 space-y-1">
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full text-left px-3 py-3 rounded-lg text-base text-destructive hover:bg-muted inline-flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("nav_logout")}
                  </button>
                ) : (
                  <>
                    <NavLink to="/login" className="px-3 py-3 rounded-lg text-base text-foreground hover:bg-muted flex items-center">
                      <LogIn className="h-4 w-4 mr-2 text-primary" />
                      {t("nav_login")}
                    </NavLink>
                    <NavLink to="/register" className="px-3 py-3 rounded-lg text-base font-semibold text-primary bg-primary-soft flex items-center">
                      {t("nav_register")}
                    </NavLink>
                  </>
                )}
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
