import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/sections/Hero";
import { Services } from "@/components/sections/Services";
import { Benefits } from "@/components/sections/Benefits";
import { DocumentsGuide } from "@/components/sections/DocumentsGuide";
import { Contact } from "@/components/sections/Contact";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Hero />
        <Services limit={3} />
        <Benefits />
        <DocumentsGuide />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
