import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Contact } from "@/components/sections/Contact";
import { useLang } from "@/i18n/LanguageContext";

const ContactPage = () => {
  const { t } = useLang();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="hero-bg border-b border-border">
          <div className="container-rural py-14 sm:py-20 text-center max-w-2xl mx-auto">
            <div className="heading-eyebrow mb-3">{t("nav_contact")}</div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">{t("contact_title")}</h1>
            <p className="text-muted-foreground">{t("contact_sub")}</p>
          </div>
        </section>
        <Contact withHeading={false} />
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
