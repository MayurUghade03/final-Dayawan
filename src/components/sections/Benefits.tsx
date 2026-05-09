import { useLang } from "@/i18n/LanguageContext";
import { ShieldCheck, Zap, HandHelping, Languages } from "lucide-react";

export function Benefits() {
  const { t } = useLang();
  const items = [
    { icon: ShieldCheck, title: "benefit_trust_t", desc: "benefit_trust_d" },
    { icon: Zap, title: "benefit_fast_t", desc: "benefit_fast_d" },
    { icon: HandHelping, title: "benefit_guide_t", desc: "benefit_guide_d" },
    { icon: Languages, title: "benefit_local_t", desc: "benefit_local_d" },
  ] as const;

  return (
    <section id="benefits" className="section-pad bg-muted/40 border-y border-border">
      <div className="container-rural">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <div className="heading-eyebrow mb-3">{t("nav_benefits")}</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">{t("benefits_title")}</h2>
          <p className="text-muted-foreground">{t("benefits_sub")}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="card-soft p-6">
                <div className="h-12 w-12 rounded-xl bg-primary-soft flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-base text-foreground mb-1.5">{t(b.title)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(b.desc)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
