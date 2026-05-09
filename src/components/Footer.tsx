import { useLang } from "@/i18n/LanguageContext";
import { Sprout, Phone, MapPin, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-foreground text-background/90">
      <div className="container-rural py-12 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Sprout className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-extrabold text-base text-background">{t("brand")}</div>
              <div className="text-xs text-background/60">{t("brand_tag")}</div>
            </div>
          </div>
          <p className="text-sm text-background/70 max-w-md">{t("hero_sub")}</p>
        </div>

        <div>
          <div className="text-sm font-semibold text-background mb-3">{t("nav_services")}</div>
          <ul className="space-y-2 text-sm text-background/70">
            <li><Link to="/services" className="hover:text-secondary min-h-0">{t("cat_gov")}</Link></li>
            <li><Link to="/services" className="hover:text-secondary min-h-0">{t("cat_farm")}</Link></li>
            <li><Link to="/services" className="hover:text-secondary min-h-0">{t("cat_online")}</Link></li>
            <li><Link to="/track" className="hover:text-secondary min-h-0">{t("nav_track")}</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold text-background mb-3">{t("nav_contact")}</div>
          <ul className="space-y-2 text-sm text-background/70">
            <li className="flex items-start gap-2 min-h-0"><Phone className="h-4 w-4 mt-0.5 text-secondary shrink-0" /><span dir="ltr">+91 99999 99999</span></li>
            <li className="flex items-start gap-2 min-h-0"><Mail className="h-4 w-4 mt-0.5 text-secondary shrink-0" /><span>hello@dayawan.in</span></li>
            <li className="flex items-start gap-2 min-h-0"><MapPin className="h-4 w-4 mt-0.5 text-secondary shrink-0" /><span>{t("address_value")}</span></li>
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
