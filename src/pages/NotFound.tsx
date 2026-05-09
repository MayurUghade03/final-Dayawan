import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLang();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background hero-bg px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl sm:text-8xl font-extrabold text-primary mb-2 tracking-tight">404</div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">{t("not_found_title")}</h1>
        <p className="text-muted-foreground mb-6">{location.pathname}</p>
        <Button asChild size="lg" className="rounded-xl h-12 px-6">
          <Link to="/"><Home className="mr-2 h-4 w-4" /> {t("not_found_home")}</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
