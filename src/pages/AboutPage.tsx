import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLang } from "@/i18n/LanguageContext";
import { Target, Eye, Heart, Sprout } from "lucide-react";

const AboutPage = () => {
  const { t } = useLang();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="hero-bg border-b border-border">
          <div className="container-rural py-14 sm:py-20 max-w-3xl">
            <div className="heading-eyebrow mb-3">{t("nav_about")}</div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">{t("about_title")}</h1>
            <p className="text-base sm:text-lg text-muted-foreground">{t("about_lead")}</p>
          </div>
        </section>

        <section className="section-pad">
          <div className="container-rural grid md:grid-cols-2 gap-5 max-w-4xl">
            <div className="card-soft p-7">
              <div className="h-12 w-12 rounded-xl bg-primary-soft flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-bold text-xl mb-2">{t("about_mission_t")}</h2>
              <p className="text-muted-foreground leading-relaxed">{t("about_mission_d")}</p>
            </div>
            <div className="card-soft p-7">
              <div className="h-12 w-12 rounded-xl bg-secondary-soft flex items-center justify-center mb-4">
                <Eye className="h-6 w-6 text-secondary" />
              </div>
              <h2 className="font-bold text-xl mb-2">{t("about_vision_t")}</h2>
              <p className="text-muted-foreground leading-relaxed">{t("about_vision_d")}</p>
            </div>
          </div>

          <div className="container-rural mt-10 max-w-4xl">
            <div className="card-soft p-7 sm:p-10 bg-primary text-primary-foreground border-primary text-center">
              <Sprout className="h-10 w-10 mx-auto mb-3" />
              <p className="text-lg sm:text-xl font-semibold max-w-2xl mx-auto">{t("hero_title")}</p>
              <div className="mt-3 inline-flex items-center gap-2 text-sm text-primary-foreground/80">
                <Heart className="h-4 w-4" /> {t("footer_made")}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
