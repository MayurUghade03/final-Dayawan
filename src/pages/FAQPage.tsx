import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLang } from "@/i18n/LanguageContext";
import { FAQS } from "@/i18n/translations";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQPage = () => {
  const { t, tr } = useLang();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="hero-bg border-b border-border">
          <div className="container-rural py-14 sm:py-20 text-center max-w-2xl mx-auto">
            <div className="heading-eyebrow mb-3">{t("nav_faq")}</div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">{t("faq_title")}</h1>
            <p className="text-muted-foreground">{t("faq_sub")}</p>
          </div>
        </section>

        <section className="section-pad">
          <div className="container-rural max-w-3xl">
            <Accordion type="single" collapsible className="space-y-3">
              {FAQS.map((f, i) => (
                <AccordionItem key={i} value={`q-${i}`} className="card-soft px-5 border">
                  <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                    {tr(f.q)}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-[15px] leading-relaxed">
                    {tr(f.a)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default FAQPage;
