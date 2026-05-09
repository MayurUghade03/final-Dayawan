import { Languages } from "lucide-react";
import { LANGUAGES } from "@/i18n/translations";
import { useLang } from "@/i18n/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const current = LANGUAGES.find((l) => l.code === lang);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 rounded-full border h-9 px-3">
          <Languages className="h-4 w-4 text-primary" />
          <span className="font-semibold text-foreground">{current?.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px] rounded-xl">
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`text-base py-2.5 cursor-pointer ${
              lang === l.code ? "bg-primary-soft font-semibold text-primary" : ""
            }`}
          >
            <span className="text-xs text-muted-foreground w-7">{l.short}</span>
            <span>{l.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
