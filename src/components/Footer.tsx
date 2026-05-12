import { useLang } from "@/i18n/LanguageContext";
import { Phone, MapPin, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandLogo } from "@/components/BrandLogo";

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-foreground text-background/90">
      <div className="container-rural py-12 grid gap-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <BrandLogo fallbackClassName="border-background/30 bg-background/5 shadow-none" />
            <div>
              <div className="font-extrabold text-base text-background">{t("brand")}</div>
              <div className="text-xs text-background/60">{t("brand_tag")}</div>
            </div>
          </div>
          <p className="text-sm text-background/70 max-w-sm">{t("hero_sub")}</p>
        </div>

        <div>
          <div className="text-sm font-semibold text-background mb-3">{t("quick_links")}</div>
          <ul className="space-y-2 text-sm text-background/70">
            <li><Link to="/services" className="hover:text-background min-h-0">{t("nav_services")}</Link></li>
            <li><Link to="/track" className="hover:text-background min-h-0">{t("nav_track")}</Link></li>
            <li><Link to="/faq" className="hover:text-background min-h-0">{t("nav_faq")}</Link></li>
            <li><Link to="/contact" className="hover:text-background min-h-0">{t("nav_contact")}</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold text-background mb-3">{t("nav_contact")}</div>
          <ul className="space-y-2 text-sm text-background/70">
            <li className="flex items-start gap-2 min-h-0"><Phone className="h-4 w-4 mt-0.5 text-background shrink-0" /><span dir="ltr">+91 72649 53363</span></li>
            <li className="flex items-start gap-2 min-h-0"><Mail className="h-4 w-4 mt-0.5 text-background shrink-0" /><span>mangeshnikas210@gmail.com</span></li>
            <li className="flex items-start gap-2 min-h-0"><MapPin className="h-4 w-4 mt-0.5 text-background shrink-0" /><span>{t("address_value")}</span></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-background/10">
        <div className="container-rural py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-background/60">
          <div>© {new Date().getFullYear()} {t("brand")} — {t("footer_rights")}</div>
          <div>{t("footer_made")}</div>
        </div>
      </div>
    </footer>
  );
}
