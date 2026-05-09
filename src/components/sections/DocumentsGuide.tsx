import { useLang } from "@/i18n/LanguageContext";
import { FolderOpen, Building, ClipboardCheck } from "lucide-react";

export function DocumentsGuide() {
  const { t } = useLang();
  const steps = [
    { icon: FolderOpen, title: "step1_t", desc: "step1_d" },
    { icon: Building, title: "step2_t", desc: "step2_d" },
    { icon: ClipboardCheck, title: "step3_t", desc: "step3_d" },
  ] as const;

  return (
    <section id="documents" className="section-pad bg-background">
      <div className="container-rural">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <div className="heading-eyebrow mb-3">{t("nav_documents")}</div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">{t("docs_title")}</h2>
          <p className="text-muted-foreground">{t("docs_sub")}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 relative">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="card-soft p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground tracking-widest">STEP 0{i + 1}</span>
                </div>
                <h3 className="font-bold text-lg text-foreground mb-1.5">{t(s.title)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(s.desc)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
