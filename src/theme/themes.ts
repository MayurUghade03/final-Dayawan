import type { ThemeAppearance, ThemeMode, ThemeTokenMap } from "@/types";

export type ResolvedThemeMode = Exclude<ThemeMode, "system">;

export interface AppTheme {
  id: string;
  name: string;
  description?: string;
  appearance: ThemeAppearance;
  tokens: ThemeTokenMap;
  active: boolean;
  built_in: boolean;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_LIGHT_THEME_ID = "theme-light-default";
export const DEFAULT_DARK_THEME_ID = "theme-dark-default";
export const DEFAULT_GLOBAL_THEME_ID = DEFAULT_LIGHT_THEME_ID;

const SHARED_SHADOWS = {
  "shadow-soft": "0 1px 2px hsl(220 38% 12% / 0.04), 0 1px 3px hsl(220 38% 12% / 0.04)",
  "shadow-card": "0 8px 24px -16px hsl(220 38% 12% / 0.24), 0 4px 10px -6px hsl(220 38% 12% / 0.10)",
  "shadow-pop": "0 14px 32px -14px hsl(217 89% 44% / 0.32)",
} as const;

const LIGHT_TOKENS: ThemeTokenMap = {
  background: "0 0% 100%",
  foreground: "220 38% 12%",
  card: "0 0% 100%",
  "card-foreground": "220 38% 12%",
  popover: "0 0% 100%",
  "popover-foreground": "220 38% 12%",
  primary: "217 89% 44%",
  "primary-foreground": "0 0% 100%",
  "primary-soft": "214 100% 96%",
  "primary-hover": "217 89% 39%",
  secondary: "220 14% 20%",
  "secondary-foreground": "0 0% 100%",
  "secondary-soft": "220 16% 94%",
  muted: "220 14% 96%",
  "muted-foreground": "220 10% 44%",
  accent: "214 100% 96%",
  "accent-foreground": "217 89% 37%",
  destructive: "0 72% 50%",
  "destructive-foreground": "0 0% 100%",
  success: "152 56% 38%",
  warning: "38 92% 50%",
  info: "199 89% 48%",
  border: "220 13% 89%",
  input: "220 13% 89%",
  ring: "217 89% 44%",
  "sidebar-background": "0 0% 98%",
  "sidebar-foreground": "240 5.3% 26.1%",
  "sidebar-primary": "217 89% 44%",
  "sidebar-primary-foreground": "0 0% 100%",
  "sidebar-accent": "214 100% 96%",
  "sidebar-accent-foreground": "217 89% 37%",
  "sidebar-border": "220 13% 89%",
  "sidebar-ring": "217 89% 44%",
  "gradient-hero":
    "radial-gradient(1100px 520px at 90% -10%, hsl(217 89% 44% / 0.10), transparent 60%), radial-gradient(700px 340px at -10% 110%, hsl(220 16% 78% / 0.22), transparent 60%)",
  ...SHARED_SHADOWS,
};

const DARK_TOKENS: ThemeTokenMap = {
  background: "222 22% 12%",
  foreground: "210 26% 94%",
  card: "222 20% 15%",
  "card-foreground": "210 26% 94%",
  popover: "222 20% 15%",
  "popover-foreground": "210 26% 94%",
  primary: "212 100% 64%",
  "primary-foreground": "224 38% 10%",
  "primary-soft": "217 44% 22%",
  "primary-hover": "212 100% 69%",
  secondary: "216 16% 84%",
  "secondary-foreground": "224 38% 12%",
  "secondary-soft": "218 25% 20%",
  muted: "218 25% 20%",
  "muted-foreground": "216 12% 74%",
  accent: "217 44% 22%",
  "accent-foreground": "212 100% 74%",
  destructive: "0 78% 60%",
  "destructive-foreground": "0 0% 100%",
  success: "152 60% 45%",
  warning: "38 92% 56%",
  info: "199 90% 61%",
  border: "218 19% 27%",
  input: "218 19% 27%",
  ring: "212 100% 64%",
  "sidebar-background": "224 24% 11%",
  "sidebar-foreground": "216 22% 91%",
  "sidebar-primary": "212 100% 64%",
  "sidebar-primary-foreground": "224 38% 10%",
  "sidebar-accent": "217 44% 22%",
  "sidebar-accent-foreground": "212 100% 74%",
  "sidebar-border": "218 19% 27%",
  "sidebar-ring": "212 100% 64%",
  "gradient-hero":
    "radial-gradient(1100px 520px at 90% -10%, hsl(212 100% 64% / 0.18), transparent 60%), radial-gradient(700px 340px at -10% 110%, hsl(220 30% 45% / 0.20), transparent 60%)",
  "shadow-soft": "0 1px 2px hsl(220 70% 2% / 0.32), 0 1px 3px hsl(220 70% 2% / 0.28)",
  "shadow-card": "0 12px 30px -18px hsl(220 70% 2% / 0.62), 0 6px 16px -10px hsl(220 70% 2% / 0.45)",
  "shadow-pop": "0 16px 36px -16px hsl(212 100% 64% / 0.50)",
};

export const BUILTIN_THEMES: AppTheme[] = [
  {
    id: DEFAULT_LIGHT_THEME_ID,
    name: "Light",
    description: "Clean light palette",
    appearance: "light",
    tokens: LIGHT_TOKENS,
    active: true,
    built_in: true,
  },
  {
    id: DEFAULT_DARK_THEME_ID,
    name: "Dark",
    description: "Accessible dark palette",
    appearance: "dark",
    tokens: DARK_TOKENS,
    active: true,
    built_in: true,
  },
];

export const THEME_TOKEN_FIELDS = [
  { key: "primary", label: "Primary color (HSL values)" },
  { key: "primary-hover", label: "Primary hover (HSL values)" },
  { key: "secondary", label: "Secondary color (HSL values)" },
  { key: "background", label: "Background (HSL values)" },
  { key: "card", label: "Surface / card (HSL values)" },
  { key: "foreground", label: "Text (HSL values)" },
  { key: "muted-foreground", label: "Secondary text (HSL values)" },
  { key: "border", label: "Border (HSL values)" },
  { key: "input", label: "Input border (HSL values)" },
  { key: "success", label: "Success (HSL values)" },
  { key: "warning", label: "Warning (HSL values)" },
  { key: "destructive", label: "Error / destructive (HSL values)" },
  { key: "info", label: "Info (HSL values)" },
  { key: "sidebar-background", label: "Sidebar background (HSL values)" },
  { key: "sidebar-foreground", label: "Sidebar text (HSL values)" },
  { key: "gradient-hero", label: "Hero gradient (CSS gradient)" },
] as const;

export function getBuiltinThemeForMode(mode: ResolvedThemeMode): AppTheme {
  return mode === "dark" ? BUILTIN_THEMES[1] : BUILTIN_THEMES[0];
}

export function ensureBuiltinThemes(themes: AppTheme[]): AppTheme[] {
  const byId = new Map<string, AppTheme>();
  for (const builtin of BUILTIN_THEMES) byId.set(builtin.id, builtin);
  for (const theme of themes) {
    byId.set(theme.id, {
      ...theme,
      description: theme.description ?? "",
      tokens: sanitizeThemeTokens(theme.tokens, theme.appearance),
    });
  }
  return Array.from(byId.values());
}

export function sanitizeThemeTokens(tokens: ThemeTokenMap, appearance: ThemeAppearance): ThemeTokenMap {
  const fallback = getBuiltinThemeForMode(appearance).tokens;
  const merged: ThemeTokenMap = { ...fallback };
  for (const [key, value] of Object.entries(tokens ?? {})) {
    if (typeof value === "string" && value.trim()) merged[key] = value.trim();
  }
  return merged;
}
