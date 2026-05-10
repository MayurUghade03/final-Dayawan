import { Button } from "@/components/ui/button";
import { useLang } from "@/i18n/LanguageContext";
import { Phone, ArrowRight, ShieldCheck, Users, Sparkles, Languages as LangIcon } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  const { t } = useLang();
  return (
    <section id="top" className="relative hero-bg border-b border-border overflow-hidden">
      <div className="container-rural section-pad">
        <div className="max-w-4xl">
          <div className="chip chip-primary mb-6">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{t("hero_eyebrow")}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-4">
            {t("hero_title")}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-2xl leading-relaxed">
            {t("hero_sub")}
          </p>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-primary hover:bg-primary-hover text-primary-foreground text-base font-semibold rounded-xl h-12 px-6 shadow-pop"
            >
              <Link to="/services">
                {t("cta_apply")} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-border bg-card text-foreground hover:border-primary hover:text-primary text-base font-semibold rounded-xl h-12 px-6"
            >
              <Link to="/track">{t("cta_track")}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-2 border-border bg-card text-foreground hover:border-primary hover:text-primary text-base font-semibold rounded-xl h-12 px-6"
            >
              <Link to="/contact">
                <Phone className="mr-2 h-5 w-5" /> {t("cta_contact")}
              </Link>
            </Button>
          </div>

          <div className="mt-10 grid sm:grid-cols-3 gap-3 max-w-3xl">
            {[
              { icon: Users, k: "trust_1" as const },
              { icon: Sparkles, k: "trust_2" as const },
              { icon: LangIcon, k: "trust_3" as const },
            ].map(({ icon: Icon, k }) => (
              <div
                key={k}
                className="card-soft px-4 py-3 flex items-center gap-2.5 text-sm text-muted-foreground"
              >
                <span className="h-8 w-8 rounded-lg bg-primary-soft border border-border flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <span className="font-medium">{t(k)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
