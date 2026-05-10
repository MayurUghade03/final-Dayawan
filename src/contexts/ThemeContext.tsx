import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Database, ThemeAppearance, ThemeMode, ThemeTokenMap } from "@/types";
import {
  AppTheme,
  BUILTIN_THEMES,
  DEFAULT_GLOBAL_THEME_ID,
  ensureBuiltinThemes,
  getBuiltinThemeForMode,
  sanitizeThemeTokens,
} from "@/theme/themes";

type ThemeCtx = {
  mode: ThemeMode;
  resolvedMode: "light" | "dark";
  themes: AppTheme[];
  availableThemes: AppTheme[];
  selectedThemeId: string | null;
  globalDefaultThemeId: string;
  activeTheme: AppTheme;
  isLoadingThemes: boolean;
  setMode: (nextMode: ThemeMode) => void;
  setSelectedThemeId: (themeId: string | null) => void;
  refreshThemes: () => Promise<void>;
  createThemeDraft: () => AppTheme;
  upsertTheme: (theme: AppTheme) => Promise<void>;
  setThemeActive: (themeId: string, active: boolean) => Promise<void>;
  setGlobalDefaultTheme: (themeId: string) => Promise<void>;
};

const THEME_MODE_STORAGE_KEY = "dayawan_theme_mode";
const THEME_ID_STORAGE_KEY = "dayawan_theme_id";
const GLOBAL_THEME_STORAGE_KEY = "dayawan_global_theme_id";
const THEMES_STORAGE_KEY = "dayawan_themes_catalog";
const THEME_TRANSITION_CLASS = "theme-transition";
const SUPABASE_NO_ROWS_ERROR = "PGRST116";

const ThemeContext = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { status, user, isAdmin } = useAuth();
  const [mode, setModeState] = useState<ThemeMode>(() => readThemeModeFromStorage());
  const [selectedThemeId, setSelectedThemeIdState] = useState<string | null>(() => readThemeIdFromStorage());
  const [globalDefaultThemeId, setGlobalDefaultThemeIdState] = useState<string>(() =>
    readGlobalThemeIdFromStorage(),
  );
  const [themes, setThemes] = useState<AppTheme[]>(() => readThemesFromStorage());
  const [systemMode, setSystemMode] = useState<"light" | "dark">(() => readSystemMode());
  const [isLoadingThemes, setIsLoadingThemes] = useState(false);
  const transitionTimeoutRef = useRef<number | undefined>(undefined);

  const canSyncProfile = Boolean(
    isSupabaseConfigured && supabase && status === "authenticated" && user,
  );
  const canManageThemes = Boolean(
    isSupabaseConfigured && supabase && status === "authenticated" && isAdmin,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setSystemMode(media.matches ? "dark" : "light");
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_MODE_STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    if (selectedThemeId) localStorage.setItem(THEME_ID_STORAGE_KEY, selectedThemeId);
    else localStorage.removeItem(THEME_ID_STORAGE_KEY);
  }, [selectedThemeId]);

  useEffect(() => {
    localStorage.setItem(GLOBAL_THEME_STORAGE_KEY, globalDefaultThemeId);
  }, [globalDefaultThemeId]);

  useEffect(() => {
    localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(themes));
  }, [themes]);

  const resolvedMode = mode === "system" ? systemMode : mode;
  const availableThemes = useMemo(() => themes.filter((theme) => theme.active), [themes]);

  const activeTheme = useMemo(() => {
    const activeBySelectedId = selectedThemeId
      ? availableThemes.find((theme) => theme.id === selectedThemeId)
      : undefined;
    if (activeBySelectedId) return activeBySelectedId;

    const activeGlobal = availableThemes.find((theme) => theme.id === globalDefaultThemeId);
    if (activeGlobal) return activeGlobal;

    return getBuiltinThemeForMode(resolvedMode);
  }, [availableThemes, globalDefaultThemeId, resolvedMode, selectedThemeId]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const fallbackTokens = getBuiltinThemeForMode(resolvedMode).tokens;
    const mergedTokens = { ...fallbackTokens, ...activeTheme.tokens };

    for (const [tokenName, tokenValue] of Object.entries(mergedTokens)) {
      root.style.setProperty(`--${tokenName}`, tokenValue);
    }

    root.classList.toggle("dark", activeTheme.appearance === "dark");
    root.setAttribute("data-theme", activeTheme.id);
    root.classList.add("theme-ready");
  }, [activeTheme, resolvedMode]);

  const runTransition = useCallback(() => {
    const root = document.documentElement;
    root.classList.add(THEME_TRANSITION_CLASS);
    if (transitionTimeoutRef.current) window.clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = window.setTimeout(() => {
      root.classList.remove(THEME_TRANSITION_CLASS);
    }, 220);
  }, []);

  const refreshThemes = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setThemes((prev) => ensureBuiltinThemes(prev));
      return;
    }

    setIsLoadingThemes(true);
    try {
      let themesQuery = supabase
        .from("app_themes")
        .select("*")
        .order("built_in", { ascending: false })
        .order("name", { ascending: true });

      if (!isAdmin) {
        themesQuery = themesQuery.eq("active", true);
      }

      const [{ data: remoteThemes, error: themeError }, { data: settings, error: settingsError }] =
        await Promise.all([
          themesQuery,
          supabase.from("app_theme_settings").select("*").eq("id", 1).maybeSingle(),
        ]);

      if (themeError) throw themeError;
      if (settingsError && settingsError.code !== SUPABASE_NO_ROWS_ERROR) throw settingsError;

      if (settings?.default_theme_id) {
        setGlobalDefaultThemeIdState(settings.default_theme_id);
      }

      const normalizedThemes = ensureBuiltinThemes(
        (remoteThemes ?? []).map((row) => normalizeThemeRow(row)),
      );
      setThemes(normalizedThemes);

      if (canSyncProfile && user) {
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("theme_mode, preferred_theme_id")
          .eq("id", user.id)
          .maybeSingle();

        if (!profileError && profileData) {
          if (isThemeMode(profileData.theme_mode)) setModeState(profileData.theme_mode);
          setSelectedThemeIdState(profileData.preferred_theme_id ?? null);
        }
      }
    } catch (error) {
      console.error("Failed to refresh themes:", error);
      setThemes((prev) => ensureBuiltinThemes(prev));
    } finally {
      setIsLoadingThemes(false);
    }
  }, [canSyncProfile, isAdmin, user]);

  useEffect(() => {
    void refreshThemes();
  }, [refreshThemes]);

  const persistProfilePreference = useCallback(
    async (payload: Database["public"]["Tables"]["user_profiles"]["Update"]) => {
      if (!canSyncProfile || !supabase || !user) return;
      const { error } = await supabase.from("user_profiles").update(payload).eq("id", user.id);
      if (error) console.error("Failed to persist user theme preference:", error);
    },
    [canSyncProfile, user],
  );

  const setMode = useCallback(
    (nextMode: ThemeMode) => {
      runTransition();
      setModeState(nextMode);
      void persistProfilePreference({ theme_mode: nextMode });
    },
    [persistProfilePreference, runTransition],
  );

  const setSelectedThemeId = useCallback(
    (themeId: string | null) => {
      runTransition();
      setSelectedThemeIdState(themeId);
      void persistProfilePreference({ preferred_theme_id: themeId });
    },
    [persistProfilePreference, runTransition],
  );

  const createThemeDraft = useCallback((): AppTheme => {
    const seed = crypto.randomUUID().split("-")[0];
    return {
      id: `theme-${seed}`,
      name: "New Theme",
      description: "",
      appearance: "light",
      tokens: sanitizeThemeTokens({}, "light"),
      active: true,
      built_in: false,
    };
  }, []);

  const upsertTheme = useCallback(
    async (theme: AppTheme) => {
      const normalized = normalizeTheme(theme);

      if (canManageThemes && supabase) {
        const payload: Database["public"]["Tables"]["app_themes"]["Insert"] = {
          id: normalized.id,
          name: normalized.name,
          description: normalized.description || null,
          appearance: normalized.appearance,
          tokens: normalized.tokens,
          active: normalized.active,
          built_in: normalized.built_in,
        };

        const { error } = await supabase.from("app_themes").upsert(payload, { onConflict: "id" });
        if (error) throw error;
      }

      setThemes((prev) => ensureBuiltinThemes(upsertThemeById(prev, normalized)));
    },
    [canManageThemes],
  );

  const setThemeActive = useCallback(
    async (themeId: string, active: boolean) => {
      if (themeId === globalDefaultThemeId && !active) {
        throw new Error("DEFAULT_THEME_MUST_REMAIN_ACTIVE");
      }

      if (canManageThemes && supabase) {
        const { error } = await supabase.from("app_themes").update({ active }).eq("id", themeId);
        if (error) throw error;
      }

      setThemes((prev) =>
        ensureBuiltinThemes(
          prev.map((theme) => (theme.id === themeId ? { ...theme, active } : theme)),
        ),
      );
    },
    [canManageThemes, globalDefaultThemeId],
  );

  const setGlobalDefaultTheme = useCallback(
    async (themeId: string) => {
      setGlobalDefaultThemeIdState(themeId);
      runTransition();

      if (canManageThemes && supabase) {
        const payload: Database["public"]["Tables"]["app_theme_settings"]["Insert"] = {
          id: 1,
          default_theme_id: themeId,
        };
        const { error } = await supabase
          .from("app_theme_settings")
          .upsert(payload, { onConflict: "id" });
        if (error) throw error;
      }
    },
    [canManageThemes, runTransition],
  );

  const value = useMemo<ThemeCtx>(
    () => ({
      mode,
      resolvedMode,
      themes,
      availableThemes,
      selectedThemeId,
      globalDefaultThemeId,
      activeTheme,
      isLoadingThemes,
      setMode,
      setSelectedThemeId,
      refreshThemes,
      createThemeDraft,
      upsertTheme,
      setThemeActive,
      setGlobalDefaultTheme,
    }),
    [
      mode,
      resolvedMode,
      themes,
      availableThemes,
      selectedThemeId,
      globalDefaultThemeId,
      activeTheme,
      isLoadingThemes,
      setMode,
      setSelectedThemeId,
      refreshThemes,
      createThemeDraft,
      upsertTheme,
      setThemeActive,
      setGlobalDefaultTheme,
    ],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

function readThemeModeFromStorage(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const raw = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
  return isThemeMode(raw) ? raw : "system";
}

function readThemeIdFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(THEME_ID_STORAGE_KEY);
}

function readGlobalThemeIdFromStorage(): string {
  if (typeof window === "undefined") return DEFAULT_GLOBAL_THEME_ID;
  return window.localStorage.getItem(GLOBAL_THEME_STORAGE_KEY) ?? DEFAULT_GLOBAL_THEME_ID;
}

function readThemesFromStorage(): AppTheme[] {
  if (typeof window === "undefined") return BUILTIN_THEMES;
  const raw = window.localStorage.getItem(THEMES_STORAGE_KEY);
  if (!raw) return BUILTIN_THEMES;

  try {
    const parsed = JSON.parse(raw) as AppTheme[];
    if (!Array.isArray(parsed)) return BUILTIN_THEMES;
    return ensureBuiltinThemes(parsed.map(normalizeTheme));
  } catch {
    return BUILTIN_THEMES;
  }
}

function readSystemMode(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function normalizeTheme(theme: AppTheme): AppTheme {
  const appearance: ThemeAppearance = theme.appearance === "dark" ? "dark" : "light";
  return {
    id: sanitizeThemeId(theme.id),
    name: theme.name.trim() || "Untitled Theme",
    description: theme.description?.trim() ?? "",
    appearance,
    tokens: sanitizeThemeTokens(theme.tokens ?? {}, appearance),
    active: theme.active !== false,
    built_in: Boolean(theme.built_in),
    created_at: theme.created_at,
    updated_at: theme.updated_at,
  };
}

function normalizeThemeRow(row: Database["public"]["Tables"]["app_themes"]["Row"]): AppTheme {
  return normalizeTheme({
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    appearance: row.appearance,
    tokens: (row.tokens as ThemeTokenMap) ?? {},
    active: row.active,
    built_in: row.built_in,
    created_at: row.created_at,
    updated_at: row.updated_at,
  });
}

function sanitizeThemeId(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || `theme-${crypto.randomUUID().split("-")[0]}`;
}

function upsertThemeById(themes: AppTheme[], theme: AppTheme): AppTheme[] {
  const index = themes.findIndex((item) => item.id === theme.id);
  if (index === -1) return [theme, ...themes];
  return themes.map((item, i) => (i === index ? theme : item));
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}
