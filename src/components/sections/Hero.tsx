import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageContext";
import { Phone, ArrowRight, ShieldCheck, Users, Sparkles, Languages as LangIcon } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  const { t } = useLang();
  return (
    <section id="top" className="relative hero-bg border-b border-border overflow-hidden">
      <div className="container-rural section-pad grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        <div className="lg:col-span-7">
          <div className="chip chip-primary mb-5">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{t("hero_eyebrow")}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-5">
            {t("hero_title")}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-xl leading-relaxed">
            {t("hero_sub")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild size="lg" className="bg-primary hover:bg-primary-hover text-primary-foreground text-base font-semibold rounded-xl h-12 px-6 shadow-pop">
              <Link to="/services">
                {t("cta_apply")} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-2 border-border bg-card text-foreground hover:border-primary hover:text-primary text-base font-semibold rounded-xl h-12 px-6">
              <Link to="/contact">
                <Phone className="mr-2 h-5 w-5" /> {t("cta_contact")}
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3 max-w-lg">
            {[
              { icon: Users, k: "trust_1" as const },
              { icon: Sparkles, k: "trust_2" as const },
              { icon: LangIcon, k: "trust_3" as const },
            ].map(({ icon: Icon, k }) => (
              <div key={k} className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <span className="h-8 w-8 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <span className="font-medium">{t(k)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/10 to-secondary/10 rounded-[2rem] blur-2xl" aria-hidden />
            <div className="relative card-soft p-6 sm:p-7 bg-card">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg text-foreground">{t("services_title")}</h3>
                <Link to="/services" className="text-sm font-semibold text-primary min-h-0 hover:underline">
                  {t("view_all")} →
                </Link>
              </div>
              <ul className="space-y-2.5">
                {[
                  { n: "01", l: t("cat_gov"), s: "Aadhaar • PAN • Ration" },
                  { n: "02", l: t("cat_farm"), s: "PM Kisan • Insurance" },
                  { n: "03", l: t("cat_online"), s: "Bills • Recharge • Print" },
                ].map((s) => (
                  <li key={s.n} className="flex items-center gap-3 p-3 rounded-xl bg-muted/60 hover:bg-primary-soft transition">
                    <span className="h-9 w-9 rounded-lg bg-card border border-border flex items-center justify-center text-xs font-bold text-primary">
                      {s.n}
                    </span>
                    <div className="leading-tight">
                      <div className="text-foreground font-semibold text-sm">{s.l}</div>
                      <div className="text-xs text-muted-foreground">{s.s}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
