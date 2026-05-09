import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Services } from "@/components/sections/Services";
import { useLang } from "@/i18n/LanguageContext";

const ServicesPage = () => {
  const { t } = useLang();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="hero-bg border-b border-border">
          <div className="container-rural py-14 sm:py-20 text-center max-w-2xl mx-auto">
            <div className="heading-eyebrow mb-3">{t("nav_services")}</div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">{t("services_title")}</h1>
            <p className="text-muted-foreground">{t("services_sub")}</p>
          </div>
        </section>
        <Services />
      </main>
      <Footer />
    </div>
  );
};

export default ServicesPage;
