import { useLang } from "@/i18n/LanguageContext";
import type { ManagedService } from "@/types";
import { Button } from "@/components/ui/button";
import { Building2, Sprout, Globe, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useServiceCatalog } from "@/contexts/ServiceCatalogContext";

const CAT_META = {
  gov: { icon: Building2, key: "cat_gov" as const },
  farm: { icon: Sprout, key: "cat_farm" as const },
  online: { icon: Globe, key: "cat_online" as const },
};

export function ServiceCard({ s }: { s: ManagedService }) {
  const Icon = CAT_META[s.category].icon;
  return (
    <Link
      to={`/services/${s.id}`}
      className="card-soft p-5 flex flex-col h-full group min-h-0"
    >
      {s.image_url ? (
        <div className="mb-4 rounded-xl overflow-hidden border border-border bg-muted/40 aspect-[16/9]">
          <img src={s.image_url} alt={s.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" loading="lazy" />
        </div>
      ) : (
        <div className="h-11 w-11 rounded-xl bg-primary-soft flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Icon className="h-5 w-5 text-primary group-hover:text-primary-foreground" />
        </div>
      )}
      <h3 className="text-base font-bold text-foreground mb-1.5">{s.title}</h3>
      <p className="text-sm text-muted-foreground mb-5 flex-1">{s.description}</p>
      <div className="flex items-center gap-1.5 text-sm font-semibold text-primary min-h-0">
        <span>View details</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

export function Services({ limit }: { limit?: number }) {
  const { t } = useLang();
  const { services } = useServiceCatalog();
  const cats: Array<keyof typeof CAT_META> = ["gov", "farm", "online"];

  return (
    <section id="services" className="section-pad bg-background">
      <div className="container-rural">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <div className="heading-eyebrow mb-3">{t("nav_services")}</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">{t("services_title")}</h2>
          <p className="text-muted-foreground">{t("services_sub")}</p>
        </div>

        <div className="space-y-14">
          {cats.map((cat) => {
            const Meta = CAT_META[cat];
            const Icon = Meta.icon;
            const all = services.filter((s) => s.category === cat && s.active);
            const items = limit ? all.slice(0, limit) : all;
            return (
              <div key={cat}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary-soft flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">{t(Meta.key)}</h3>
                  </div>
                  {limit && all.length > limit && (
                    <Link to="/services" className="text-sm font-semibold text-primary hover:underline min-h-0">
                      {t("view_all")} →
                    </Link>
                  )}
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((s) => (
                    <ServiceCard key={s.id} s={s} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {limit && (
          <div className="text-center mt-12">
            <Button asChild size="lg" variant="outline" className="rounded-xl border-2 h-12 px-6">
              <Link to="/services">{t("view_all")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
