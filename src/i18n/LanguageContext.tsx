import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Lang, t as dict } from "./translations";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof dict) => string;
  tr: <T extends { mr: string; hi: string; en: string }>(obj: T) => string;
};

const LanguageContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "dayawan_lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("mr");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved && ["mr", "hi", "en"].includes(saved)) setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
  };

  const t = (key: keyof typeof dict) => dict[key]?.[lang] ?? String(key);
  const tr = <T extends { mr: string; hi: string; en: string }>(obj: T) => obj[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tr }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
